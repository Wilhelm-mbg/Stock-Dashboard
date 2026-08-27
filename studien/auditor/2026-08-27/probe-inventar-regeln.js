'use strict';
/* ====== Auditor: INVENTAR des Reiters "Regeln" (27.08.2026, 17:30) ======
 *
 * Wilhelms Auftrag ueber den PM: der ganze Reiter ist ihm "viel zu viel und
 * unuebersichtlich und teilweise unlogisch und verwirrend". Erster Schritt ist
 * eine BESTANDSAUFNAHME - nicht bauen, nicht entscheiden, aufnehmen.
 *
 * Diese Probe nimmt den Teil auf, den NUR das laufende Programm hergibt: was
 * wirklich auf dem Schirm steht, nachdem JS die Seite gefuellt hat. Die
 * "Uebersicht" hat im HTML zwei Bedienelemente und traegt in Wirklichkeit die
 * ganze Strategieliste - solche Unterschiede sieht man dem Quelltext nicht an.
 *
 * Was hier NICHT entschieden wird: ob ein Bedienelement WIRKT. Dazu gehoert der
 * Code, und ein "kein Aufrufer gefunden" ist ein Nullbefund - der braucht eine
 * Gegenprobe von der Code-Seite. Diese Probe sammelt nur die Kennungen und
 * markiert, was sie NICHT beurteilen kann.
 *
 * Nach den Lehren dieses Tages:
 *  - Sichtbarkeit am Rechteck UND Fokussierbarkeit ueber document.activeElement.
 *    Ein gefuelltes Rechteck heisst nicht, dass man hinkommt (#109 war genau der
 *    Fehler: zugeklapptes <details>, Rechteck gefuellt, Fokus verweigert).
 *  - Rechtecke werden VOR dem Fokussieren erfasst, in Dokumentkoordinaten
 *    (rect + scrollY). el.focus() scrollt, danach gemessene Geometrie ist wertlos.
 *  - KLICK-SPERRLISTE: nichts wird geklickt ausser Reitern und Pillen.
 *
 * Aufruf aus der Repo-Wurzel:
 *   .\node_modules\.bin\electron.cmd studien\auditor\2026-08-27\probe-inventar-regeln.js
 *
 * ACHTUNG: WURZEL geht DREI Ebenen hoch. Geschrieben wird nur nach %TEMP%. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..', '..', '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-auditor-inv-'));
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

/* Messprotokolle saeen: ohne sie sind Regelbuch und Uebersicht Leerzustaende und
 * das Inventar wuerde die Haelfte der Karten gar nicht sehen. */
function saatLegen() {
  const quelle = path.join(WURZEL, 'studien', 'messmaschine', 'protokolle');
  const ziel = path.join(TESTROOT, 'downloads', 'Markt-Dashboard-Daten', 'protokolle');
  fs.mkdirSync(ziel, { recursive: true });
  let n = 0;
  fs.readdirSync(quelle).filter((f) => f.endsWith('.json')).forEach((f) => {
    fs.copyFileSync(path.join(quelle, f), path.join(ziel, f)); n++;
  });
  const sd = path.join(TESTROOT, 'userdata', 'store');
  fs.mkdirSync(sd, { recursive: true });
  fs.writeFileSync(path.join(sd, 'theme.json'), JSON.stringify('light'), 'utf8');
  return n;
}
const SAATZAHL = saatLegen();

const INVENTAR = "(function (subId) {" +
  "var wurzel = document.getElementById(subId);" +
  "if (!wurzel) return { fehlt: subId };" +
  "var sy = window.scrollY, sx = window.scrollX;" +
  "function sichtbar(el) { var s = getComputedStyle(el);" +
  "  if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;" +
  "  var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }" +
  /* Beschriftung: was ein Mensch an diesem Bedienelement liest. */
  "function name(el) {" +
  "  var n = (el.getAttribute('aria-label') || '').trim();" +
  "  if (!n && el.getAttribute('aria-labelledby')) {" +
  "    var z = document.getElementById(el.getAttribute('aria-labelledby'));" +
  "    if (z) n = (z.textContent || '').trim(); }" +
  "  if (!n && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) {" +
  "    if (el.id) { var lb = document.querySelector('label[for=\"' + el.id + '\"]');" +
  "      if (lb) n = (lb.textContent || '').trim(); }" +
  "    if (!n && el.closest('label')) n = (el.closest('label').textContent || '').trim(); }" +
  "  if (!n) n = (el.textContent || '').trim();" +
  "  if (!n) n = (el.getAttribute('placeholder') || '').trim();" +
  "  if (!n) n = (el.getAttribute('title') || '').trim();" +
  "  return n.replace(/\\s+/g, ' ').slice(0, 90); }" +
  /* In welcher Karte sitzt es, und unter welcher Ueberschrift? */
  "function karte(el) {" +
  "  var p = el.closest('.panel');" +
  "  if (!p) return { kopf: '(ausserhalb jeder Karte)', id: '' };" +
  "  var h = p.querySelector('h2, h3, h4, b');" +
  "  return { kopf: h ? (h.textContent || '').replace(/\\s+/g,' ').trim().slice(0, 60) : '(Karte ohne Ueberschrift)'," +
  "    id: p.id || '' }; }" +
  "function wert(el) {" +
  "  if (el.tagName === 'SELECT') { var o = el.options[el.selectedIndex];" +
  "    return { wert: el.value, gezeigt: o ? (o.textContent||'').trim().slice(0,40) : ''," +
  "      moeglich: el.options.length }; }" +
  "  if (el.type === 'checkbox' || el.type === 'radio') return { wert: el.checked ? 'an' : 'aus' };" +
  "  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return { wert: String(el.value).slice(0, 40) };" +
  "  return null; }" +
  "var WAHL = 'button, input:not([type=hidden]), select, textarea, a[href], [role=button], [role=switch]';" +
  "var elemente = [];" +
  /* ERST alle Rechtecke, DANN erst fokussieren - focus() scrollt. */
  "var roh = Array.prototype.slice.call(wurzel.querySelectorAll(WAHL));" +
  "var vorab = roh.map(function (el) { var r = el.getBoundingClientRect();" +
  "  return { el: el, x: Math.round(r.left + sx), y: Math.round(r.top + sy)," +
  "    br: Math.round(r.width), ho: Math.round(r.height), sicht: sichtbar(el) }; });" +
  "vorab.forEach(function (v, i) {" +
  "  var el = v.el;" +
  "  var k = karte(el);" +
  "  var fokus = null;" +
  "  if (v.sicht && !el.disabled) {" +
  "    try { el.focus(); fokus = document.activeElement === el;" +
  "      if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }" +
  "    catch (e) { fokus = null; } }" +
  "  elemente.push({ nr: i, id: el.id || ''," +
  "    tag: el.tagName.toLowerCase(), typ: el.getAttribute('type') || ''," +
  "    name: name(el), karte: k.kopf, karteId: k.id," +
  "    sichtbar: v.sicht, fokussierbar: fokus, gesperrt: !!el.disabled," +
  "    y: v.y, x: v.x," +
  "    wert: wert(el)," +
  "    datenAttribute: Array.prototype.filter.call(el.attributes, function (a) {" +
  "      return a.name.indexOf('data-') === 0; }).map(function (a) { return a.name + '=' + a.value; }).slice(0, 4)," +
  /* onclick als Eigenschaft gesetzt? Das ist EIN Hinweis auf Verdrahtung, aber
   * kein Beweis fuer das Gegenteil - addEventListener sieht man von hier nicht. */
  "    onclickEigenschaft: typeof el.onclick === 'function'," +
  "    onchangeEigenschaft: typeof el.onchange === 'function' }); });" +
  "var karten = Array.prototype.map.call(wurzel.querySelectorAll('.panel'), function (p) {" +
  "  if (!sichtbar(p)) return null;" +
  "  var h = p.querySelector('h2, h3, h4, b');" +
  "  var t = (p.innerText || '').replace(/\\s+/g, ' ').trim();" +
  "  return { id: p.id || ''," +
  "    kopf: h ? (h.textContent || '').replace(/\\s+/g,' ').trim().slice(0, 70) : '(ohne Ueberschrift)'," +
  "    zeichen: t.length, bedienelemente: p.querySelectorAll('button, input, select, textarea').length," +
  "    anfang: t.slice(0, 160) }; }).filter(Boolean);" +
  "var ueber = Array.prototype.map.call(wurzel.querySelectorAll('h2, h3, h4'), function (h) {" +
  "  return { stufe: h.tagName, text: (h.textContent||'').replace(/\\s+/g,' ').trim().slice(0, 70) }; });" +
  "return { sub: subId," +
  "  textZeichen: (wurzel.innerText || '').replace(/\\s+/g,' ').trim().length," +
  "  elemente: elemente, karten: karten, ueberschriften: ueber," +
  "  zahlSichtbar: elemente.filter(function (e) { return e.sichtbar; }).length," +
  "  zahlGesamt: elemente.length }; })";

async function js2(win, code) { return win.webContents.executeJavaScript(code, true); }
async function warte(ms) { return new Promise((r) => setTimeout(r, ms)); }

setTimeout(() => { console.error('Inventar: Zeitlimit.'); app.exit(2); }, 900000);

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
      win.setContentSize(1280, 900);
      await warte(600);
      await js2(win, "(function(){var b=document.querySelector('nav.tabs [data-tab=\"strategien\"]'); if(b) b.click(); return 'ok';})()");
      await warte(2500);

      const subs = await js2(win, "Array.prototype.map.call(document.querySelectorAll('#tab-strategien .pills button[data-sub]'), function (b) { return { sub: b.getAttribute('data-sub'), pille: (b.textContent||'').trim() }; })");
      const alles = [];
      for (const s of subs) {
        await js2(win, "(function(){var p=document.querySelector('#tab-strategien .pills [data-sub=\"" + s.sub + "\"]'); if(p) p.click(); return 'ok';})()");
        await warte(2600);
        const inv = await js2(win, INVENTAR + '(' + JSON.stringify('sub-' + s.sub) + ')');
        inv.pille = s.pille;
        alles.push(inv);
        console.log('  ' + s.pille + ' (sub-' + s.sub + '): ' + inv.zahlSichtbar + '/' + inv.zahlGesamt +
          ' sichtbar, ' + inv.karten.length + ' Karten, ' + inv.textZeichen + ' Zeichen Text');
      }
      fs.writeFileSync(path.join(TESTROOT, 'inventar.json'), JSON.stringify({ protokolle: SAATZAHL, subs: alles }, null, 1));
      console.log('BERICHT=' + path.join(TESTROOT, 'inventar.json'));
      const summe = alles.reduce((a, s) => a + s.zahlSichtbar, 0);
      console.log('SUMME sichtbare Bedienelemente im Reiter Regeln: ' + summe);
      app.exit(0);
    } catch (e) {
      console.error('Inventar abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
