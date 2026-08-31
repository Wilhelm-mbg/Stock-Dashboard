'use strict';
/* ================= Probe: schreibt das News-Archiv wirklich wieder? =================
 *
 * ANLASS (31.08.2026): Von 21.08. bis 31.08. kam im News-Archiv nichts an. Die Quelle
 * war gesund; der einzige Aufrufweg zu getSymbolNews() lag in runJob(), und runJob()
 * startet von selbst nur bei eingeschalteter Stunden-Strategie - die am 21.08. als
 * widerlegt abgeschaltet wurde. Seither hat der eigenstaendige Takt newsArchivLauf()
 * diese Aufgabe.
 *
 * WARUM DIESE PROBE UND NICHT NUR test-v6: test-v6 prueft den Quelltext. Es kann
 * zeigen, dass ein ungebundener Takt DASTEHT - nicht, dass am Ende ein Eintrag im
 * Store LIEGT. Genau diese Luecke hat den Fehler zehn Tage lang getragen: ein Archiv,
 * das nichts tut, sieht von aussen aus wie ein Archiv ohne Neuigkeiten.
 *
 * ISOLIERT wie tools/ui-probe.js: frisches userData unter %TEMP%. Der Store der
 * installierten App wird nie beruehrt. Sie braucht NETZ.
 *
 * Aufruf aus der Repo-Wurzel:
 *   .\node_modules\.bin\electron.cmd tools\newsarchiv-probe.js
 *
 * Exit 0: mindestens ein newsarchiv_-Schluessel mit Eintraegen angelegt.
 * Exit 1: der Takt lief, aber nichts wurde geschrieben (Befund).
 * Exit 2: die Probe kam nicht durch (Zeitlimit, Startfehler).
 * Kein Teil von npm test - sie braucht Fenster, Netz und rund zwei Minuten. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-news-probe-'));
const USERDATA = path.join(TESTROOT, 'userdata');
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

function archivDateien() {
  const dir = path.join(USERDATA, 'store');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /^newsarchiv_/.test(f));
}

/* Der Takt startet 30 s nach init; 150 s Limit lassen Luft fuer Start und Abrufe. */
setTimeout(() => { console.error('News-Probe: Zeitlimit erreicht.'); app.exit(2); }, 150000);

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  win.webContents.once('did-finish-load', async () => {
    try {
      console.log('News-Probe: isolierter Datenordner ' + TESTROOT);
      console.log('  vor dem Takt: ' + archivDateien().length + ' newsarchiv_-Dateien');
      /* Warten, bis der Takt gelaufen ist - er beginnt 30 s nach init und braucht
       * je Symbol 1,2 s.
       * MASSGEBLICH SIND DIE DATEIEN, nicht der Stand: depot.js legt sein D nicht
       * auf window, die Abfrage unten liefert deshalb null. Das ist Absicht und kein
       * Fehlschlag - was zaehlt, ist ein Eintrag IM STORE. Genau die Verwechslung
       * "sieht laufend aus" gegen "hat geschrieben" hat den Fehler getragen. */
      let stand = null;
      for (let i = 0; i < 22; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        stand = await win.webContents.executeJavaScript(
          "(function(){try{return JSON.stringify((window.Depot&&window.Depot.D||{}).newsArchivStand||null);}catch(e){return null;}})()", true);
        const n = archivDateien().length;
        console.log('  +' + ((i + 1) * 5) + ' s: ' + n + ' Dateien, Stand ' + stand);
        if (n > 0) break;
      }
      const dateien = archivDateien();
      if (!dateien.length) {
        console.error('BEFUND: der Takt hat nichts geschrieben - Stand ' + stand);
        return app.exit(1);
      }
      const erste = JSON.parse(fs.readFileSync(path.join(USERDATA, 'store', dateien[0]), 'utf8'));
      const n = (erste.items || []).length;
      console.log('News-Probe gruen: ' + dateien.length + ' Schluessel, ' + dateien[0] +
        ' haelt ' + n + ' Eintraege.');
      if (n) console.log('  juengster Titel: ' + String(erste.items[n - 1][1]).slice(0, 80));
      app.exit(n > 0 ? 0 : 1);
    } catch (e) {
      console.error('News-Probe abgebrochen: ' + ((e && e.message) || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
