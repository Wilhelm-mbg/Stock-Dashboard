'use strict';
/* ====== Auditor, Barrierefreiheit Teil 1: TASTATURREIHENFOLGE (27.08.2026, 08:35) ======
 *
 * Auftrag des PM, mit zwei Auflagen, die beide aus meinen eigenen Fehlern von heute
 * stammen:
 *   1. Den offsetParent-Pruefer VOR dem Lauf reparieren. Er ist bei position:fixed
 *      immer null und hat heute frueh stillschweigend jedes feste Element
 *      uebersprungen - "0 von 1.747" sah nach Gruendlichkeit aus und war blind.
 *      Hier steht deshalb die Rechteck-Pruefung, und der fixed-KOEDER bleibt drin.
 *   2. Kontrast bleibt liegen. Nur Tastatur, dafuer ueber alle fuenf Reiter.
 *
 * DREI KOEDER, weil ein Nullbefund ohne Positivkontrolle heute schon viermal
 * beinahe als Ergebnis durchgegangen waere:
 *   K1 fixed + ohne Namen  -> muss in "ohneNamen" auftauchen (prueft zugleich, dass
 *                             die Sichtbarkeitspruefung feste Elemente SIEHT)
 *   K2 visuell oben, im DOM zuletzt -> muss als Reihenfolge-Bruch auftauchen
 *   K3 tabindex="5"        -> muss als positiver tabindex auftauchen
 * Findet die Probe einen davon nicht, ist ihr jeweiliger Nullbefund wertlos - und
 * sie sagt das selbst.
 *
 * Aufruf aus der Repo-Wurzel:
 *   .\node_modules\.bin\electron.cmd studien\auditor\2026-08-27\probe-tastatur.js
 *
 * ACHTUNG: WURZEL geht von hier DREI Ebenen hoch. Geklickt wird nur Navigation;
 * geschrieben wird ausschliesslich nach %TEMP%. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..', '..', '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-auditor-tast-'));
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
const BILDER = path.join(TESTROOT, 'bilder');
fs.mkdirSync(BILDER, { recursive: true });

const TASTCODE = "(function (marke, mitKoeder) {" +
  "var koeder = [];" +
  "if (mitKoeder) {" +
  "  var k1 = document.createElement('button');" +
  "  k1.id = 'koederK1';" +
  "  k1.style.cssText = 'position:fixed; right:4px; bottom:4px; width:20px; height:20px; z-index:9999;';" +
  "  document.body.appendChild(k1); koeder.push(k1);" +
  "  var k2 = document.createElement('button');" +
  "  k2.id = 'koederK2'; k2.textContent = 'K2 oben';" +
  "  k2.style.cssText = 'position:absolute; left:4px; top:2px; z-index:9999;';" +
  "  document.body.appendChild(k2); koeder.push(k2);" +
  "  var k3 = document.createElement('button');" +
  "  k3.id = 'koederK3'; k3.textContent = 'K3'; k3.setAttribute('tabindex', '5');" +
  "  document.body.appendChild(k3); koeder.push(k3); }" +
  /* SICHTBARKEIT AM RECHTECK, nicht an offsetParent - siehe Kopf dieser Datei. */
  "function sichtbar(el) { var s = getComputedStyle(el);" +
  "  if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;" +
  "  var r = el.getBoundingClientRect();" +
  "  return r.width > 0 && r.height > 0; }" +
  "function kurz(el) {" +
  "  return (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +" +
  "    (el.className && typeof el.className === 'string' && el.className.trim() ?" +
  "      '.' + el.className.trim().split(/\\s+/)[0] : '')).slice(0, 60); }" +
  "function name(el) {" +
  "  var n = (el.getAttribute('aria-label') || '').trim();" +
  "  if (!n && el.getAttribute('aria-labelledby')) {" +
  "    var z = document.getElementById(el.getAttribute('aria-labelledby'));" +
  "    if (z) n = (z.textContent || '').trim(); }" +
  "  if (!n) n = (el.textContent || '').trim();" +
  "  if (!n) n = (el.getAttribute('title') || '').trim();" +
  "  if (!n && el.tagName === 'INPUT') {" +
  "    n = (el.getAttribute('placeholder') || '').trim();" +
  "    if (!n && el.id) { var lb = document.querySelector('label[for=\"' + el.id + '\"]');" +
  "      if (lb) n = (lb.textContent || '').trim(); }" +
  "    if (!n && el.closest('label')) n = (el.closest('label').textContent || '').trim(); }" +
  "  return n; }" +
  "var WAHL = 'a[href], button, input:not([type=hidden]), select, textarea, [tabindex], [role=button]';" +
  "var alle = Array.prototype.slice.call(document.querySelectorAll(WAHL));" +
  "var fokus = alle.filter(function (el) {" +
  "  if (el.disabled) return false;" +
  "  var ti = el.getAttribute('tabindex');" +
  "  if (ti !== null && parseInt(ti, 10) < 0) return false;" +
  "  return sichtbar(el); });" +
  /* 1. positiver tabindex - reisst die Reihenfolge aus dem Dokument heraus */
  "var positivTab = fokus.filter(function (el) {" +
  "  var ti = parseInt(el.getAttribute('tabindex'), 10);" +
  "  return !isNaN(ti) && ti > 0; }).map(function (el) {" +
  "    return { wo: kurz(el), tabindex: el.getAttribute('tabindex'), name: name(el).slice(0, 40) }; });" +
  /* 2. ohne zugaenglichen Namen */
  "var ohneNamen = fokus.filter(function (el) { return !name(el); })" +
  "  .map(function (el) { return { wo: kurz(el), tag: el.tagName," +
  "    typ: el.getAttribute('type') || '' }; });" +
  /* 3. gleiche Beschriftung mehrfach - der Bildschirmleser hoert dasselbe */
  "var namen = {};" +
  "fokus.forEach(function (el) { var n = name(el).replace(/\\s+/g, ' ').trim();" +
  "  if (!n || n.length > 40) return;" +
  "  (namen[n] = namen[n] || []).push(kurz(el)); });" +
  "var doppelt = Object.keys(namen).filter(function (n) { return namen[n].length > 1; })" +
  "  .map(function (n) { return { name: n, anzahl: namen[n].length, wo: namen[n].slice(0, 4) }; });" +
  /* 4. Reihenfolge im DOM gegen die Lesereihenfolge auf dem Schirm.
   * Zeilenbaender von 14 px: was auf derselben Hoehe steht, gilt als eine Zeile. */
  "var mitOrt = fokus.map(function (el, i) { var r = el.getBoundingClientRect();" +
  "  return { i: i, el: el, x: Math.round(r.left), y: Math.round(r.top), wo: kurz(el)," +
  "    name: name(el).replace(/\\s+/g,' ').slice(0, 30) }; });" +
  "var lese = mitOrt.slice().sort(function (a, b) {" +
  "  if (Math.abs(a.y - b.y) > 14) return a.y - b.y;" +
  "  return a.x - b.x; });" +
  "var brueche = [];" +
  "for (var j = 0; j < lese.length; j++) {" +
  "  if (lese[j].i !== j) brueche.push({ position: j, sollte: lese[j].wo," +
  "    name: lese[j].name, domIndex: lese[j].i, x: lese[j].x, y: lese[j].y }); }" +
  /* 5. Koeder wieder einsammeln und Rechenschaft ablegen */
  "var gefunden = { K1: ohneNamen.some(function (o) { return o.wo.indexOf('koederK1') !== -1; })," +
  "  K2: brueche.some(function (b) { return b.sollte.indexOf('koederK2') !== -1; })," +
  "  K3: positivTab.some(function (p) { return p.wo.indexOf('koederK3') !== -1; }) };" +
  "koeder.forEach(function (k) { k.remove(); });" +
  "function ohneK(arr, feld) { return arr.filter(function (x) {" +
  "  return String(x[feld] || '').indexOf('koeder') === -1; }); }" +
  "return { marke: marke, fokussierbar: fokus.length," +
  "  positivTab: ohneK(positivTab, 'wo'), ohneNamen: ohneK(ohneNamen, 'wo')," +
  "  doppelt: doppelt.filter(function (d) { return d.name.indexOf('K2') === -1 && d.name.indexOf('K3') === -1; })," +
  "  brueche: ohneK(brueche, 'sollte').slice(0, 12), bruecheGesamt: ohneK(brueche, 'sollte').length," +
  "  koederGesetzt: !!mitKoeder, koederGefunden: gefunden }; })";

/* Sieht man den Fokus? Ein Sprung ohne sichtbaren Rahmen ist fuer die Tastatur
 * dasselbe wie kein Fokus. Gemessen an drei echten Bedienelementen. */
const FOKUSSICHT = "(function () {" +
  "var proben = [];" +
  "var kandidaten = Array.prototype.slice.call(document.querySelectorAll('nav.tabs button[data-tab], .pills button[data-sub], .btn')).slice(0, 3);" +
  "kandidaten.forEach(function (el) {" +
  "  el.focus();" +
  "  var s = getComputedStyle(el);" +
  "  proben.push({ wo: (el.id ? '#' + el.id : el.tagName + '.' + (el.className||'').split(' ')[0])," +
  "    text: (el.textContent||'').trim().slice(0, 24)," +
  "    umriss: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor," +
  "    umrissAus: s.outlineStyle === 'none' || s.outlineWidth === '0px'," +
  "    schatten: s.boxShadow === 'none' ? '' : s.boxShadow.slice(0, 40)," +
  "    rand: s.borderColor }); });" +
  "if (document.activeElement && document.activeElement.blur) document.activeElement.blur();" +
  "return proben; })()";

async function js2(win, code) { return win.webContents.executeJavaScript(code, true); }
async function warte(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function reiter(win, tab, sub) {
  await js2(win, "(function(){var b=document.querySelector('nav.tabs [data-tab=\"" + tab + "\"]'); if(b) b.click();" +
    (sub ? "var s=document.querySelector('#tab-" + tab + " .pills [data-sub=\"" + sub + "\"]'); if(s) s.click();" : '') +
    "return 'ok';})()");
}

setTimeout(() => { console.error('Tastaturprobe: Zeitlimit.'); app.exit(2); }, 700000);

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
      await warte(600);

      const tabs = await js2(win, "Array.prototype.map.call(document.querySelectorAll('nav.tabs button[data-tab]'), function (b) { return b.getAttribute('data-tab'); })");
      const ergebnisse = [];
      for (const tab of tabs) {
        await reiter(win, tab, null);
        await warte(2200);
        /* Erst MIT Koedern (Positivkontrolle), dann ohne - die Zahlen des zweiten
         * Laufs sind die berichteten, die Koeder nur der Beleg, dass der Pruefer
         * ueberhaupt etwas findet. */
        const mit = await js2(win, TASTCODE + '(' + JSON.stringify(tab) + ', true)');
        const ohne = await js2(win, TASTCODE + '(' + JSON.stringify(tab) + ', false)');
        ohne.koederGefunden = mit.koederGefunden;
        ergebnisse.push(ohne);
      }
      /* Die Kursarchiv-Karte eigens: dort sitzen die drei gleichnamigen Knoepfe. */
      await reiter(win, 'werkzeuge', 'archiv');
      await warte(7000);
      const archiv = await js2(win, TASTCODE + '("werkzeuge/archiv", false)');
      const fokus = await js2(win, FOKUSSICHT);
      const bild = await win.webContents.capturePage();
      fs.writeFileSync(path.join(BILDER, 'tastatur-archiv.png'), bild.toPNG());

      const bericht = { protokolle: SAATZAHL, bilder: BILDER, reiter: ergebnisse, archiv, fokusSicht: fokus };
      fs.writeFileSync(path.join(TESTROOT, 'tastatur.json'), JSON.stringify(bericht, null, 1));
      console.log('BERICHT=' + path.join(TESTROOT, 'tastatur.json'));
      console.log('BILDER=' + BILDER);
      ergebnisse.concat([archiv]).forEach((r) => {
        console.log('--- ' + r.marke + ' (' + r.fokussierbar + ' fokussierbar) ---');
        if (r.koederGesetzt || r.koederGefunden) {
          console.log('  Koeder: K1(ohne Name)=' + r.koederGefunden.K1 +
            ' K2(Reihenfolge)=' + r.koederGefunden.K2 + ' K3(tabindex)=' + r.koederGefunden.K3);
        }
        console.log('  positiver tabindex: ' + r.positivTab.length +
          (r.positivTab.length ? ' -> ' + JSON.stringify(r.positivTab.slice(0, 3)) : ''));
        console.log('  ohne Namen: ' + r.ohneNamen.length +
          (r.ohneNamen.length ? ' -> ' + JSON.stringify(r.ohneNamen.slice(0, 4)) : ''));
        console.log('  Reihenfolge-Brueche: ' + r.bruecheGesamt +
          (r.bruecheGesamt ? ' -> ' + JSON.stringify(r.brueche.slice(0, 3)) : ''));
        console.log('  gleiche Beschriftung mehrfach: ' + r.doppelt.length +
          (r.doppelt.length ? ' -> ' + JSON.stringify(r.doppelt.slice(0, 3)) : ''));
      });
      console.log('--- Fokus sichtbar? ---');
      fokus.forEach((f) => console.log('  ' + f.wo + ' ' + JSON.stringify(f.text) +
        ' Umriss=' + f.umriss + (f.umrissAus ? '  <== KEIN UMRISS' : '') +
        (f.schatten ? ' Schatten=' + f.schatten : '')));
      app.exit(0);
    } catch (e) {
      console.error('Tastaturprobe abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
