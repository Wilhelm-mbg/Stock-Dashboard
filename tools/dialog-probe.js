'use strict';
/* ================= DIALOG-PROBE: die Fokusreihenfolge IN Dialogen =================
 *
 * Der letzte offene Punkt aus Stufe F. tools/a11y-probe.js oeffnet keine Dialoge -
 * dieser eine von vier Punkten ist deshalb nie gemessen worden, und "nicht gemessen"
 * ist in diesem Projekt der Zustand, aus dem die meisten Fehler kamen.
 *
 * Gemessen wird das VERHALTEN mit echten Tastenanschlaegen, nicht der Quelltext:
 *   1. Wandert der Fokus beim Oeffnen ueberhaupt IN den Dialog?
 *   2. Landet er auf einem sinnvollen Element - und nicht auf dem Schliessen-Kreuz?
 *   3. Faengt Tab am Ende zum Anfang zurueck (Fokusfalle)?
 *   4. Und Umschalt+Tab am Anfang ans Ende?
 *   5. Schliesst Escape - und kommt der Fokus zum AUSLOESER zurueck?
 *   6. Hat der Dialog einen Namen, den eine Vorlesehilfe ansagen kann?
 *
 * Punkt 5 ist der, den man ohne Tastatur nie bemerkt: kommt der Fokus nicht zurueck,
 * steht er nach dem Schliessen am Seitenanfang, und man tabbt sich durch die ganze
 * Oberflaeche zurueck zu der Stelle, an der man war.
 *
 * VOLLSTAENDIG ISOLIERT wie tools/ui-probe.js: frisches userData, frischer
 * Datenordner unter %TEMP%. Die Installation des Nutzers wird nie beruehrt.
 *
 * Aufruf aus der Repo-Wurzel (ein Fenster erscheint kurz - das ist normal):
 *
 *   .\node_modules\.bin\electron.cmd tools\dialog-probe.js
 *
 * Exit 0: kein Befund. Exit 1: mindestens ein Befund. Exit 2: die Probe kam nicht
 * durch. Kein Teil von npm test - sie braucht ein Fenster und echte Zeit.
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-dialog-probe-'));
app.setPath('userData', path.join(TESTROOT, 'userdata'));
app.setPath('downloads', path.join(TESTROOT, 'downloads'));
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

const origLoadFile = BrowserWindow.prototype.loadFile;
BrowserWindow.prototype.loadFile = function (fp, opts) {
  if (!path.isAbsolute(fp)) fp = path.join(WURZEL, fp);
  return origLoadFile.call(this, fp, opts);
};

/* Die fuenf Dialoge der App. Der Ausloeser ist der Knopf, den ein Mensch draeuckt -
 * gemessen wird ueber ihn und nicht ueber openModal(), damit auch ein Dialog
 * auffaellt, der an der gemeinsamen Mechanik vorbei geoeffnet wird. */
const DIALOGE = [
  { id: 'setModalBg', name: 'Einstellungen', ausloeser: '#btnSettings' },
  { id: 'diagModalBg', name: 'Diagnose', ausloeser: null },
  { id: 'aiModalBg', name: 'Bericht', ausloeser: null },
  { id: 'ticketModalBg', name: 'Order-Ticket', ausloeser: null },
  { id: 'wasNeuModalBg', name: 'Was ist neu', ausloeser: null },
];

function taste(wc, key, mods) {
  wc.sendInputEvent({ type: 'keyDown', keyCode: key, modifiers: mods || [] });
  wc.sendInputEvent({ type: 'char', keyCode: key, modifiers: mods || [] });
  wc.sendInputEvent({ type: 'keyUp', keyCode: key, modifiers: mods || [] });
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe(win) {
  const wc = win.webContents;
  const js = (code) => wc.executeJavaScript(code, true);
  const befunde = [];
  const zeilen = [];

  /* Wilhelms Rechner hat prefers-reduced-motion AKTIV. Das ist bei ihm der
   * Normalfall, nicht der Sonderfall - deshalb wird es mitgemessen und nicht
   * wegemuliert. */
  const rm = await js("window.matchMedia('(prefers-reduced-motion: reduce)').matches");
  zeilen.push('prefers-reduced-motion: ' + (rm ? 'AKTIV (wie bei Wilhelm)' : 'aus'));

  for (const d of DIALOGE) {
    const da = await js("!!document.getElementById('" + d.id + "')");
    if (!da) { befunde.push(d.name + ': Dialog fehlt im Dokument'); continue; }

    /* Einen Ausloeser setzen, damit "Fokus kehrt zurueck" ueberhaupt pruefbar ist.
     * Ohne merkbaren Ausloeser waere Punkt 5 nicht entscheidbar - und "nicht
     * entscheidbar" darf nicht wie "bestanden" aussehen. */
    await js(
      "(function () { var b = document.createElement('button');" +
      " b.id = '__probeAusloeser'; b.textContent = 'Probe';" +
      " document.body.appendChild(b); b.focus(); return document.activeElement.id; })()");
    const vorher = await js('document.activeElement.id');
    if (vorher !== '__probeAusloeser') {
      befunde.push(d.name + ': Der Probe-Ausloeser liess sich nicht fokussieren - Messung ungueltig');
      await js("(function(){var b=document.getElementById('__probeAusloeser'); if(b) b.remove();})()");
      continue;
    }

    await js("window.openModal('" + d.id + "')");
    await pause(350);

    const drin = await js(
      "(function () { var bg = document.getElementById('" + d.id + "');" +
      " return !!(bg && bg.classList.contains('open') && bg.contains(document.activeElement)); })()");
    const erstes = await js('document.activeElement.tagName + "/" + (document.activeElement.textContent||"").trim().slice(0,24)');
    if (!drin) befunde.push(d.name + ': Der Fokus wandert beim Oeffnen NICHT in den Dialog (steht auf ' + erstes + ')');

    /* Name fuer die Vorlesehilfe: aria-labelledby muss auf etwas Vorhandenes zeigen. */
    const name = await js(
      "(function () { var m = document.querySelector('#" + d.id + " [role=\"dialog\"]') ||" +
      " document.querySelector('#" + d.id + " .modal'); if (!m) return null;" +
      " var l = m.getAttribute('aria-labelledby');" +
      " if (l) { var z = document.getElementById(l); return z ? ('labelledby:' + (z.textContent||'').trim().slice(0,30)) : 'labelledby ZEIGT INS LEERE'; }" +
      " return m.getAttribute('aria-label') ? 'label' : null; })()");
    if (!name) befunde.push(d.name + ': Der Dialog hat keinen Namen fuer die Vorlesehilfe');
    else if (/INS LEERE/.test(name)) befunde.push(d.name + ': aria-labelledby zeigt auf ein Element, das es nicht gibt');

    /* Fokusfalle vorwaerts: ans Ende springen, dann Tab - muss zum Anfang zurueck. */
    const anzahl = await js(
      "(function () { var bg = document.getElementById('" + d.id + "');" +
      " var f = [].slice.call(bg.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=\"hidden\"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex=\"-1\"])'))" +
      "  .filter(function (e) { return e.offsetWidth || e.offsetHeight || e.getClientRects().length; });" +
      " if (f.length) f[f.length - 1].focus();" +
      " return f.length; })()");
    if (!anzahl) {
      befunde.push(d.name + ': Kein fokussierbares Element im Dialog - die Fokusfalle ist nicht pruefbar');
    } else {
      taste(wc, 9);                       // Tab
      await pause(160);
      const nochDrin = await js(
        "(function () { var bg = document.getElementById('" + d.id + "');" +
        " return !!bg.contains(document.activeElement); })()");
      if (!nochDrin) befunde.push(d.name + ': Tab am Ende faellt AUS dem Dialog heraus - keine Fokusfalle');

      /* Rueckwaerts: an den Anfang, dann Umschalt+Tab. */
      await js(
        "(function () { var bg = document.getElementById('" + d.id + "');" +
        " var f = [].slice.call(bg.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=\"hidden\"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex=\"-1\"])'))" +
        "  .filter(function (e) { return e.offsetWidth || e.offsetHeight || e.getClientRects().length; });" +
        " if (f.length) f[0].focus(); })()");
      taste(wc, 9, ['shift']);
      await pause(160);
      const nochDrin2 = await js(
        "(function () { var bg = document.getElementById('" + d.id + "');" +
        " return !!bg.contains(document.activeElement); })()");
      if (!nochDrin2) befunde.push(d.name + ': Umschalt+Tab am Anfang faellt AUS dem Dialog heraus');
    }

    /* Escape: schliesst er, und kommt der Fokus zum Ausloeser zurueck? */
    taste(wc, 27);
    await pause(260);
    const zu = await js("!document.getElementById('" + d.id + "').classList.contains('open')");
    if (!zu) befunde.push(d.name + ': Escape schliesst den Dialog nicht');
    const zurueck = await js('document.activeElement.id');
    if (zu && zurueck !== '__probeAusloeser') {
      befunde.push(d.name + ': Nach dem Schliessen steht der Fokus auf "' + zurueck +
        '" statt auf dem Ausloeser - man tabbt sich durch die ganze Seite zurueck');
    }

    zeilen.push('  ' + d.name.padEnd(16) + 'Fokus hinein ' + (drin ? 'ja' : 'NEIN') +
      ' | Elemente ' + String(anzahl).padStart(2) +
      ' | Escape ' + (zu ? 'ja' : 'NEIN') +
      ' | Fokus zurueck ' + (zurueck === '__probeAusloeser' ? 'ja' : 'NEIN') +
      ' | erstes: ' + erstes);

    await js("(function(){var bg=document.getElementById('" + d.id + "'); if(bg) bg.classList.remove('open');" +
      " var b=document.getElementById('__probeAusloeser'); if(b) b.remove();})()");
    await pause(120);
  }

  const seitenFehler = await js('(window.__probeFehler || []).slice(0, 10)');
  return { befunde, zeilen, seitenFehler: seitenFehler || [] };
}

setTimeout(() => { console.error('Dialog-Probe: Zeitlimit (120 s).'); app.exit(2); }, 120000);

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  win.webContents.once('did-finish-load', async () => {
    try {
      await new Promise((r) => setTimeout(r, 4000));
      await win.webContents.executeJavaScript(
        "window.__probeFehler = [];" +
        "window.addEventListener('error', function (e) { window.__probeFehler.push(String(e.message || e)); });" +
        "'bereit'", true);
      const erg = await probe(win);
      console.log('Dialog-Probe: Fokusreihenfolge in Dialogen\n');
      erg.zeilen.forEach((z) => console.log(z));
      if (erg.seitenFehler.length) {
        console.log('\nSeitenfehler waehrend der Probe:');
        erg.seitenFehler.forEach((f) => console.log('  ' + f));
      }
      if (erg.befunde.length) {
        console.log('\n' + erg.befunde.length + ' BEFUND(E):');
        erg.befunde.forEach((b) => console.log('  - ' + b));
        app.exit(1);
      } else {
        console.log('\nDialog-Probe gruen: Fokus wandert hinein, faengt sich, Escape schliesst, Fokus kehrt zurueck.');
        app.exit(0);
      }
    } catch (e) {
      console.error('Dialog-Probe kaputt: ' + (e && e.stack || e));
      app.exit(2);
    }
  });
});
