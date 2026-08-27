'use strict';
/* ====== Auditor: steht #109 ueberhaupt? (27.08.2026, 17:00) ======
 *
 * Der PM meldet einen Befund von `06`: in einem ZUGEKLAPPTEN <details> laesst
 * `content-visibility` das Rechteck GEFUELLT. Meine Tastaturprobe misst Sichtbarkeit
 * am Rechteck - sie haette den Knopf #stUebernehmen also als sichtbar gezaehlt,
 * obwohl er zugeklappt und damit gar nicht mit der Tabulatortaste erreichbar ist.
 *
 * WENN DAS STIMMT, IST #109 EIN FALSCHBEFUND VON MIR - und zwar einer, der als
 * Issue draussen ist und jemandem zugeteilt wurde. Das muss ich wissen, bevor
 * jemand etwas repariert, das nicht kaputt ist.
 *
 * Die Frage ist mit dem Rechteck NICHT zu beantworten (genau das ist ja der
 * Streitpunkt). Entschieden wird sie am einzigen Kriterium, das zaehlt:
 * BEKOMMT DAS ELEMENT DEN FOKUS, wenn man ihn ihm gibt? Ein Element, das
 * document.activeElement nicht wird, steht in keiner Tabulatorreihenfolge.
 *
 * Mit Positivkontrolle in beide Richtungen:
 *   - ein bekannt fokussierbares Element MUSS activeElement werden
 *   - derselbe Knopf wird zusaetzlich bei GEOEFFNETEM <details> gemessen
 *     (dann muss er fokussierbar sein - sonst misst meine Methode gar nichts)
 *
 * Aufruf aus der Repo-Wurzel:
 *   .\node_modules\.bin\electron.cmd studien\auditor\2026-08-27\probe-109-gegenprobe.js
 *
 * ACHTUNG: WURZEL geht DREI Ebenen hoch. Geschrieben wird nur nach %TEMP%. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..', '..', '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-auditor-109-'));
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
const sd = path.join(TESTROOT, 'userdata', 'store');
fs.mkdirSync(sd, { recursive: true });
fs.writeFileSync(path.join(sd, 'theme.json'), JSON.stringify('light'), 'utf8');

const CODE = "(function () {" +
  "var d = document.getElementById('stCodeAuf');" +
  "var b = document.getElementById('stUebernehmen');" +
  "if (!b) return { fehlt: 'stUebernehmen' };" +
  "function bild(el) { var s = getComputedStyle(el); var r = el.getBoundingClientRect();" +
  "  return { anzeige: s.display, sicht: s.visibility," +
  "    inhaltSichtbar: s.contentVisibility || '(nicht unterstuetzt)'," +
  "    breite: Math.round(r.width), hoehe: Math.round(r.height)," +
  "    y: Math.round(r.top), x: Math.round(r.left)," +
  "    rechteckGefuellt: r.width > 0 && r.height > 0 }; }" +
  /* DAS entscheidende Kriterium: wird es activeElement? */
  "function fokussierbar(el) { try { el.focus(); } catch (e) { return false; }" +
  "  var ja = document.activeElement === el;" +
  "  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();" +
  "  return ja; }" +
  /* Positivkontrolle: ein Element, das ganz sicher fokussierbar ist. */
  "var ctrl = document.querySelector('nav.tabs button[data-tab]');" +
  "var raus = { positivkontrolle: { wo: ctrl ? ctrl.id : null, fokussierbar: ctrl ? fokussierbar(ctrl) : null } };" +
  "raus.detailsDa = !!d;" +
  "raus.zu = d ? !d.open : null;" +
  "raus.zugeklappt = { bild: bild(b), fokussierbar: fokussierbar(b) };" +
  /* Jetzt aufklappen und dasselbe noch einmal - Gegenrichtung der Kontrolle. */
  "if (d) { d.open = true; }" +
  "raus.aufgeklappt = { bild: bild(b), fokussierbar: d ? fokussierbar(b) : null };" +
  "if (d) { d.open = false; }" +
  /* Und die Tabulatorkette, wie der Browser sie wirklich sieht: alle Elemente,
   * die den Fokus TATSAECHLICH annehmen, in DOM-Reihenfolge. */
  "var kandidaten = Array.prototype.slice.call(document.querySelectorAll(" +
  "  'a[href], button, input:not([type=hidden]), select, textarea, [tabindex]'));" +
  "var kette = [];" +
  "kandidaten.forEach(function (el) {" +
  "  if (el.disabled) return;" +
  "  var ti = el.getAttribute('tabindex');" +
  "  if (ti !== null && parseInt(ti, 10) < 0) return;" +
  "  if (!fokussierbar(el)) return;" +
  "  var r = el.getBoundingClientRect();" +
  "  kette.push({ wo: (el.id ? '#' + el.id : el.tagName.toLowerCase())," +
  "    y: Math.round(r.top), x: Math.round(r.left) }); });" +
  "raus.ketteLaenge = kette.length;" +
  "raus.uebernehmenInKette = kette.some(function (k) { return k.wo === '#stUebernehmen'; });" +
  /* Reihenfolge-Bruch NUR auf der echten Kette rechnen. */
  "var lese = kette.slice().sort(function (a2, b2) {" +
  "  if (Math.abs(a2.y - b2.y) > 14) return a2.y - b2.y; return a2.x - b2.x; });" +
  "var brueche = 0;" +
  "for (var i = 0; i < lese.length; i++) { if (lese[i] !== kette[i]) brueche++; }" +
  "raus.bruecheEchteKette = brueche;" +
  "raus.ketteAusschnitt = kette.slice(10, 20);" +
  "return raus; })()";

async function warte(ms) { return new Promise((r) => setTimeout(r, ms)); }

setTimeout(() => { console.error('109-Gegenprobe: Zeitlimit.'); app.exit(2); }, 400000);

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  win.webContents.on('did-finish-load', async function einmal() {
    win.webContents.removeListener('did-finish-load', einmal);
    try {
      await warte(6000);
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
      await warte(1200);
      win.setContentSize(1280, 800);
      await win.webContents.executeJavaScript(
        "(function(){var b=document.querySelector('nav.tabs [data-tab=\"messung\"]'); if(b) b.click(); return 'ok';})()", true);
      await warte(3000);
      const erg = await win.webContents.executeJavaScript(CODE, true);
      fs.writeFileSync(path.join(TESTROOT, 'gegenprobe109.json'), JSON.stringify(erg, null, 1));
      console.log(JSON.stringify(erg, null, 1));
      app.exit(0);
    } catch (e) {
      console.error('Abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
