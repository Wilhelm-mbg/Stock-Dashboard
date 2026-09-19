'use strict';
/* ================= Probe: schreibt das News-Archiv wirklich - und bleibt die App bedienbar? =================
 *
 * ANLASS (31.08.2026): Von 21.08. bis 31.08. kam im News-Archiv nichts an. Die Quelle
 * war gesund; der einzige Aufrufweg zu getSymbolNews() lag in runJob(), und runJob()
 * startet von selbst nur bei eingeschalteter Stunden-Strategie - die am 21.08. als
 * widerlegt abgeschaltet wurde. Seither hat der eigenstaendige Takt newsArchivLauf()
 * diese Aufgabe.
 *
 * AUSBAU (19.09.2026, Nr. 43): das Archiv liegt nicht mehr im Store, sondern als
 * Tagesablage <Daten>/nachrichten/<SYM>/<jahr>.jsonl, geschrieben asynchron im
 * Hauptprozess; das Universum kommt aus <Daten>/nachrichten-universum.json. Die Probe
 * legt eine Universum-Datei mit 30 Symbolen in den isolierten Datenordner, wartet den
 * Lauf ab und prueft DREI Dinge: (1) die Ablage entsteht, (2) der Stand im Store zaehlt
 * (Symbole, mit Meldungen, leer-200, Fehler, Dauer), (3) der Hauptprozess bleibt frei -
 * eine Responding-Sonde fragt waehrend des Laufs alle 100 ms `live-stand` ueber IPC
 * (Soll wie beim Live-Sammler: max < 100 ms, p99 < 50 ms), mit Positivkontrolle.
 *
 * WARUM DIESE PROBE UND NICHT NUR test-v6: test-v6 prueft den Quelltext. Es kann
 * zeigen, dass ein ungebundener Takt DASTEHT - nicht, dass am Ende eine Zeile in der
 * Ablage LIEGT. Genau diese Luecke hat den Fehler zehn Tage lang getragen: ein Archiv,
 * das nichts tut, sieht von aussen aus wie ein Archiv ohne Neuigkeiten.
 *
 * ISOLIERT wie tools/ui-probe.js: frisches userData und frischer Datenordner unter
 * %TEMP%. Store und Datenordner der installierten App werden nie beruehrt. Sie braucht
 * NETZ (30 Anfragen an den RSS-Endpunkt, 1,2 s Pause). Kein Klick auf irgendeinen Knopf.
 *
 * Aufruf aus der Repo-Wurzel:
 *   .\node_modules\.bin\electron.cmd tools\newsarchiv-probe.js
 *
 * Exit 0: Ablage entstanden, Zaehler stimmig, Hauptprozess frei.
 * Exit 1: Befund (steht im Protokoll).
 * Exit 2: die Probe kam nicht durch (Zeitlimit, Startfehler).
 * Kein Teil von npm test - sie braucht Fenster, Netz und rund zwei Minuten. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-news-probe-'));
const USERDATA = path.join(TESTROOT, 'userdata');
const DATEN = path.join(TESTROOT, 'downloads', 'Markt-Dashboard-Daten');
const N_SYMBOLE = 30;
app.setPath('userData', USERDATA);
app.setPath('downloads', path.join(TESTROOT, 'downloads'));
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

const origLoadFile = BrowserWindow.prototype.loadFile;
BrowserWindow.prototype.loadFile = function (fp, opts) {
  if (!path.isAbsolute(fp)) fp = path.join(WURZEL, fp);
  return origLoadFile.call(this, fp, opts);
};

/* Das Universum der Probe: 30 Symbole, gleichmaessig aus der echten Universum-Datei
 * des Nutzers gezogen, wenn es sie gibt - sonst 30 bekannte Grosswerte. Geschrieben
 * wird NUR in den isolierten Datenordner. */
function probeUniversum() {
  let quelle = null;
  try { quelle = JSON.parse(fs.readFileSync(path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'nachrichten-universum.json'), 'utf8')); } catch (e) { quelle = null; }
  let symbole = (quelle && Array.isArray(quelle.symbole)) ? quelle.symbole : [];
  if (symbole.length >= N_SYMBOLE) {
    const schritt = Math.floor(symbole.length / N_SYMBOLE);
    symbole = symbole.filter((s, i) => i % schritt === 0).slice(0, N_SYMBOLE);
  } else {
    symbole = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'BRK.B', 'JPM', 'V', 'UNH', 'XOM', 'JNJ', 'PG', 'MA',
      'HD', 'COST', 'ABBV', 'KO', 'PEP', 'AVGO', 'LLY', 'MRK', 'WMT', 'CVX', 'BAC', 'ORCL', 'CRM', 'AMD', 'NFLX'];
  }
  return { kennung: 'nachrichten-universum/probe', stand: new Date().toISOString(), quelle: 'Probe: ' + symbole.length + ' Symbole', symbole };
}
fs.mkdirSync(DATEN, { recursive: true });
const UNI = probeUniversum();
fs.writeFileSync(path.join(DATEN, 'nachrichten-universum.json'), JSON.stringify(UNI));
/* Ein alter Store-Schluessel, damit die Migration etwas zu tun hat. */
fs.mkdirSync(path.join(USERDATA, 'store'), { recursive: true });
fs.writeFileSync(path.join(USERDATA, 'store', 'newsarchiv_PROBEALT.json'), JSON.stringify({ stand: 1, items: [[Date.UTC(2026, 0, 2), 'Alter Eintrag aus dem Store'], [Date.UTC(2026, 0, 3), 'Zweiter alter Eintrag']] }));

function ablageOrdner() {
  const dir = path.join(DATEN, 'nachrichten');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((d) => fs.readdirSync(path.join(dir, d)).some((f) => /^\d{4}\.jsonl$/.test(f)));
}
function standLesen() {
  try { return (JSON.parse(fs.readFileSync(path.join(USERDATA, 'store', 'depot.json'), 'utf8')) || {}).newsArchivStand || null; } catch (e) { return null; }
}
function messSchleife(name) {
  return 'window.' + name + ' = { proben: [], laeuft: true, fehler: 0 };' +
    '(async function () { while (window.' + name + '.laeuft) { var t0 = performance.now();' +
    ' try { await window.api.liveStand(); } catch (e) { window.' + name + '.fehler++; }' +
    ' window.' + name + '.proben.push(performance.now() - t0);' +
    ' await new Promise(function (r) { setTimeout(r, 100); }); } })(); "ok"';
}
function statistik(proben) {
  const s = (proben || []).slice().sort((a, b) => a - b);
  if (!s.length) return { n: 0, max: null, p99: null, mittel: null };
  return { n: s.length, max: Math.round(s[s.length - 1]), p99: Math.round(s[Math.min(s.length - 1, Math.max(0, Math.ceil(0.99 * s.length) - 1))]),
    mittel: Math.round(s.reduce((a, b) => a + b, 0) / s.length) };
}

/* Der Takt startet 30 s nach init; 30 Symbole mal rund 1,7 s sind ~50 s. */
setTimeout(() => { console.error('News-Probe: Zeitlimit erreicht.'); app.exit(2); }, 240000);

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  win.webContents.once('did-finish-load', async () => {
    const funde = [];
    try {
      const js = (code) => win.webContents.executeJavaScript(code, true);
      console.log('News-Probe: isolierter Datenordner ' + TESTROOT);
      console.log('  Universum: ' + UNI.symbole.length + ' Symbole (' + UNI.symbole.slice(0, 5).join(', ') + ' ...)');
      console.log('  vor dem Takt: ' + ablageOrdner().length + ' Symbolordner in der Ablage');
      await js(messSchleife('__ipcMess'));
      /* Warten, bis der Lauf durch ist: der Stand im Store traegt `dauerS` erst am Ende.
       * MASSGEBLICH SIND DIE DATEIEN UND DER STAND, nicht die Oberflaeche. */
      let stand = null;
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        stand = standLesen();
        console.log('  +' + ((i + 1) * 5) + ' s: ' + ablageOrdner().length + ' Symbolordner, Stand ' + JSON.stringify(stand));
        if (stand && stand.dauerS !== undefined && stand.symbole === UNI.symbole.length) break;
      }
      const mess = await js('(function () { window.__ipcMess.laeuft = false; return { proben: window.__ipcMess.proben.slice(), fehler: window.__ipcMess.fehler }; })()');
      const s = statistik(mess && mess.proben);
      console.log('  Antwortzeit live-stand waehrend des Laufs: n=' + s.n + ', max ' + s.max + ' ms, p99 ' + s.p99 + ' ms, Mittel ' + s.mittel + ' ms, IPC-Fehler ' + (mess ? mess.fehler : '?'));

      /* (1) Die Ablage */
      const ordner = ablageOrdner();
      const fremd = ordner.filter((o) => UNI.symbole.indexOf(o) < 0 && o !== 'PROBEALT');
      console.log('  Ablage: ' + ordner.length + ' Symbolordner' + (fremd.length ? ', FREMD: ' + fremd.join(',') : ''));
      if (!ordner.length) funde.push('der Lauf hat nichts in die Ablage geschrieben');
      if (fremd.length) funde.push('Symbole ausserhalb des Universums in der Ablage: ' + fremd.join(','));
      const beispiel = ordner.filter((o) => o !== 'PROBEALT')[0];
      if (beispiel) {
        const dateien = fs.readdirSync(path.join(DATEN, 'nachrichten', beispiel));
        const text = fs.readFileSync(path.join(DATEN, 'nachrichten', beispiel, dateien[0]), 'utf8');
        const zeilen = text.split('\n').filter(Boolean);
        let ok = /\n$/.test(text);
        zeilen.forEach((z) => { try { const e = JSON.parse(z); if (!Array.isArray(e) || e.length !== 2 || typeof e[0] !== 'number' || typeof e[1] !== 'string') ok = false; } catch (e) { ok = false; } });
        console.log('  ' + beispiel + '/' + dateien[0] + ': ' + zeilen.length + ' Zeilen, Form ' + (ok ? 'ok' : 'VERLETZT') + (zeilen.length ? ', juengste: ' + String(JSON.parse(zeilen[zeilen.length - 1])[1]).slice(0, 70) : ''));
        if (!ok || !zeilen.length) funde.push('Ablage ' + beispiel + ' hat eine verletzte Form oder keine Zeile');
      }
      const alt = path.join(DATEN, 'nachrichten', 'PROBEALT', '2026.jsonl');
      if (!fs.existsSync(alt) || fs.readFileSync(alt, 'utf8').split('\n').filter(Boolean).length !== 2) funde.push('die Migration hat den alten Store-Schluessel nicht (vollstaendig) uebernommen');
      else console.log('  Migration: PROBEALT mit 2 Eintraegen in der Ablage');
      if (fs.existsSync(path.join(USERDATA, 'store')) && fs.readdirSync(path.join(USERDATA, 'store')).some((f) => /^newsarchiv_/.test(f) && f !== 'newsarchiv_PROBEALT.json')) funde.push('der Lauf schreibt weiter Store-Schluessel newsarchiv_');

      /* (2) Der Stand */
      if (!stand || stand.dauerS === undefined) funde.push('der Stand im Store traegt keine Dauer - der Lauf ist nicht zu Ende gekommen');
      else {
        const summe = (stand.mitMeldungen || 0) + (stand.leer200 || 0) + (stand.fehler || 0);
        console.log('  Stand: ' + JSON.stringify(stand));
        if (stand.symbole !== UNI.symbole.length) funde.push('Stand zaehlt ' + stand.symbole + ' Symbole statt ' + UNI.symbole.length + ' - das Universum kam nicht aus der Datei');
        if (!/Probe/.test(stand.quelle || '')) funde.push('Stand nennt nicht die Universum-Datei als Quelle: ' + stand.quelle);
        if (summe > stand.symbole) funde.push('Zaehler unstimmig: mitMeldungen+leer200+fehler=' + summe + ' > ' + stand.symbole);
        if (stand.mitMeldungen !== ordner.filter((o) => o !== 'PROBEALT').length) funde.push('Stand meldet ' + stand.mitMeldungen + ' Symbole mit Meldungen, die Ablage hat ' + ordner.filter((o) => o !== 'PROBEALT').length);
        if (stand.abbruch) funde.push('der Lauf brach ab: ' + stand.abbruch);
      }

      /* (3) Der Hauptprozess - mit Positivkontrolle der Sonde */
      if (s.n < 20) funde.push('nur ' + s.n + ' Sondenproben - die Messschleife lief nicht');
      if (s.n && (s.max >= 100 || s.p99 >= 50)) funde.push('der Lauf blockiert den Hauptprozess: max ' + s.max + ' ms, p99 ' + s.p99 + ' ms (Soll max < 100, p99 < 50)');
      await js(messSchleife('__ipcMess2'));
      await new Promise((r) => setTimeout(r, 300));
      const t0 = Date.now(); while (Date.now() - t0 < 150) { /* absichtliche Sperre */ }
      await new Promise((r) => setTimeout(r, 300));
      const mess2 = await js('(function () { window.__ipcMess2.laeuft = false; return window.__ipcMess2.proben.slice(); })()');
      const s2 = statistik(mess2);
      console.log('  Positivkontrolle (Sperre 150 ms im Hauptprozess): Sonde sah max ' + s2.max + ' ms');
      if (!(s2.max >= 50)) funde.push('die Sonde sieht eine absichtliche Sperre von 150 ms nicht (max ' + s2.max + ' ms) - ihre Zahlen belegen nichts');

      if (funde.length) { console.error('BEFUND:\n  - ' + funde.join('\n  - ')); return app.exit(1); }
      console.log('News-Probe gruen: Ablage fuer ' + ordner.length + ' Symbole, Stand stimmig, Hauptprozess frei.');
      app.exit(0);
    } catch (e) {
      console.error('News-Probe abgebrochen: ' + ((e && e.message) || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
