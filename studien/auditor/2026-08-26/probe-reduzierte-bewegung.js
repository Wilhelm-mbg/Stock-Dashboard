'use strict';
/* ===== Auditor, Gegenprobe: das News-Laufband bei "Bewegung reduzieren" =====
 *
 * Verdacht aus der optischen Pruefung (Nacht auf 26.08.2026): index.html Zeile 166
 * schaltet unter prefers-reduced-motion die Animation der Laufband-Spur ab -
 * ersatzlos. Der Rahmen #newsTicker steht aber auf overflow:hidden und
 * white-space:nowrap. Steht die Spur still, waere alles jenseits der Fensterbreite
 * dauerhaft unerreichbar: kein Rollbalken, kein Umbruch, kein zweiter Weg.
 *
 * Diese Probe behauptet das nicht, sie misst es. Sie startet die App zweimal in
 * derselben Isolation wie tools/ui-probe.js - einmal normal, einmal mit
 * Emulation.setEmulatedMedia(prefers-reduced-motion: reduce) - und zaehlt je Lauf,
 * wie viele Meldungen des Laufbands innerhalb des sichtbaren Rahmens liegen.
 *
 * Aufruf aus der Repo-Wurzel:
 *   .\node_modules\.bin\electron.cmd studien\auditor\2026-08-26\probe-reduzierte-bewegung.js
 *
 * Geklickt wird nichts. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..', '..', '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-auditor-rm-'));
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

/* Zaehlt die Meldungen des Laufbands und wie viele davon im sichtbaren Rahmen
 * liegen, dazu die Verschiebung der Spur zu zwei Zeitpunkten. Bewegt sie sich
 * nicht UND liegt der Grossteil ausserhalb, ist der Inhalt unerreichbar. */
const MESSCODE = '(function () {' +
  'var t = document.getElementById("newsTicker");' +
  'if (!t) return JSON.stringify({ da: false });' +
  'var sp = t.querySelector(".tickSpur");' +
  'var tr = t.getBoundingClientRect();' +
  'var links = Array.prototype.slice.call(t.querySelectorAll("a"));' +
  'var drin = links.filter(function (a) { var r = a.getBoundingClientRect();' +
  '  return r.left < tr.right && r.right > tr.left; });' +
  'return JSON.stringify({ da: true, sichtbar: getComputedStyle(t).display !== "none",'  +
  '  reduzierteBewegung: matchMedia("(prefers-reduced-motion: reduce)").matches,' +
  '  overflow: getComputedStyle(t).overflow, umbruch: getComputedStyle(t).whiteSpace,' +
  '  animation: sp ? getComputedStyle(sp).animationName : "-",' +
  '  dauer: sp ? getComputedStyle(sp).animationDuration : "-",' +
  '  transform: sp ? getComputedStyle(sp).transform : "-",' +
  '  breiteSpur: sp ? Math.round(sp.getBoundingClientRect().width) : 0,' +
  '  breiteRahmen: Math.round(tr.width),' +
  '  meldungen: links.length, imRahmen: drin.length }); })()';

function warte(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function messen(win, reduziert) {
  const wc = win.webContents;
  if (reduziert) {
    /* Chromium kennt die Einstellung nur ueber das DevTools-Protokoll. */
    wc.debugger.attach('1.3');
    await wc.debugger.sendCommand('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });
    /* Neu laden, damit die Regel beim Aufbau greift. */
    wc.reload();
    await new Promise((r) => wc.once('did-finish-load', r));
  }
  await warte(9000);
  const a = JSON.parse(await wc.executeJavaScript(MESSCODE, true));
  await warte(2500);
  const b = JSON.parse(await wc.executeJavaScript(MESSCODE, true));
  const bild = await wc.capturePage();
  fs.writeFileSync(path.join(TESTROOT, (reduziert ? 'reduziert' : 'normal') + '.png'), bild.toPNG());
  return { erst: a, danach: b, bewegtSich: a.transform !== b.transform };
}

setTimeout(() => { console.error('Gegenprobe: Zeitlimit.'); app.exit(2); }, 240000);

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  win.webContents.once('did-finish-load', async () => {
    try {
      win.setContentSize(1280, 800);
      await warte(6000);
      /* Einwilligungsfrage ohne Antwort wegklicken - erlaubt und ungefaehrlich. */
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
      await warte(600);

      const normal = await messen(win, false);
      const reduziert = await messen(win, true);
      const bericht = { ordner: TESTROOT, normal, reduziert };
      fs.writeFileSync(path.join(TESTROOT, 'gegenprobe.json'), JSON.stringify(bericht, null, 1));
      console.log('ORDNER=' + TESTROOT);
      console.log('NORMAL   bewegt=' + normal.bewegtSich +
        ' anim=' + normal.erst.animation + '/' + normal.erst.dauer +
        ' redBew=' + normal.erst.reduzierteBewegung + ' meldungen=' + normal.erst.meldungen + ' imRahmen=' + normal.erst.imRahmen +
        ' spur=' + normal.erst.breiteSpur + 'px rahmen=' + normal.erst.breiteRahmen + 'px');
      console.log('REDUZIERT bewegt=' + reduziert.bewegtSich +
        ' anim=' + reduziert.erst.animation + '/' + reduziert.erst.dauer +
        ' redBew=' + reduziert.erst.reduzierteBewegung + ' meldungen=' + reduziert.erst.meldungen + ' imRahmen=' + reduziert.erst.imRahmen +
        ' overflow=' + reduziert.erst.overflow + ' umbruch=' + reduziert.erst.umbruch);
      app.exit(0);
    } catch (e) {
      console.error('Gegenprobe abgebrochen: ' + (e && e.stack || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
