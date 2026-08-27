'use strict';
/* ====== Auditor, Gegenprobe zu v8.34.0 + dunkles Thema (27.08.2026, 08:15) ======
 *
 * Auftrag des PM: (1) die vier Funde der Nacht am AUSGELIEFERTEN Stand nachstellen,
 * damit die Issue-Wache ueber eine Nachlieferung entscheiden kann; (2) danach das
 * dunkle Thema, weil #107 (Ausrichtung) und #101 (Farbklassen greifen nur unter
 * bestimmten Eltern) beide Familien sind, die im Dunkeln anders ausfallen koennen.
 *
 * WICHTIG - was ich beim ersten Melden falsch hatte: die Funde sind zwar in einem
 * VORFAHREN des Tags gemessen (04c9be5), aber zwischen Messung und Tag hat die
 * Issue-Wache repariert. Ancestry allein beweist also NICHT, dass ein Fund in der
 * Auslieferung steckt. Diese Probe fragt deshalb das laufende Programm, nicht die
 * Historie.
 *
 * Der Arbeitsbaum wird NICHT umgestellt: kein Auschecken des Tags, keine Bewegung
 * von HEAD. In diesem Repo arbeiten mehrere Sitzungen im selben Baum; ein Checkout
 * waere ein Eingriff in fremde Arbeit. Belegt ist die Gleichheit stattdessen mit
 * `git diff v8.34.0 HEAD -- <Funddateien>` (leer) - der laufende Baum IST an diesen
 * Dateien der ausgelieferte Stand.
 *
 * Aufruf aus der Repo-Wurzel:
 *   .\node_modules\.bin\electron.cmd studien\auditor\2026-08-27\probe-gegenprobe-834.js
 *
 * ACHTUNG: WURZEL geht von hier DREI Ebenen hoch. Geklickt wird nur Navigation. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..', '..', '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-auditor834-'));
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

const STORE = path.join(TESTROOT, 'userdata', 'store');
function saatLegen(thema) {
  const quelle = path.join(WURZEL, 'studien', 'messmaschine', 'protokolle');
  const ziel = path.join(TESTROOT, 'downloads', 'Markt-Dashboard-Daten', 'protokolle');
  fs.mkdirSync(ziel, { recursive: true });
  let n = 0;
  fs.readdirSync(quelle).filter((f) => f.endsWith('.json')).forEach((f) => {
    fs.copyFileSync(path.join(quelle, f), path.join(ziel, f)); n++;
  });
  fs.mkdirSync(STORE, { recursive: true });
  fs.writeFileSync(path.join(STORE, 'theme.json'), JSON.stringify(thema), 'utf8');
  return n;
}
const SAATZAHL = saatLegen('light');

const BILDER = path.join(TESTROOT, 'bilder');
fs.mkdirSync(BILDER, { recursive: true });

/* ---- #106: steht irgendwo noch ein roher Bindestrich-Schluessel? ----
 * Gesucht wird der Bauplan der Urteils-Schluessel als GANZER Elementinhalt:
 * kleingeschrieben, mit Bindestrich verbunden, ohne Leerzeichen. Strategienamen
 * (monatsende-kauf) sehen genauso aus - deshalb wird gegen die BEKANNTE Liste der
 * Urteile geprueft und nicht gegen das Muster allein. */
const ROHCODE = "(function (marke) {" +
  "var URTEILE = ['bestaetigt','nicht-bestaetigt','nicht-entscheidbar','nicht-messbar'," +
  "  'widerlegt','bestaetigt-aber-nullpunkt-verschoben'];" +
  "var treffer = [];" +
  "function sichtbar(el) { var s = getComputedStyle(el);" +
  "  if (s.display === 'none' || s.visibility === 'hidden') return false;" +
  "  return !!(el.offsetParent || s.position === 'fixed'); }" +
  "Array.prototype.forEach.call(document.querySelectorAll('td, th, b, span, li, code, div'), function (el) {" +
  "  if (el.children.length) return; if (!sichtbar(el)) return;" +
  "  var t = (el.textContent || '').trim();" +
  "  if (URTEILE.indexOf(t) === -1) return;" +
  "  treffer.push({ text: t, tag: el.tagName," +
  "    wo: (el.parentElement && el.parentElement.id ? '#' + el.parentElement.id : '') +" +
  "        ' ' + (el.closest('[id]') ? '#' + el.closest('[id]').id : '?') }); });" +
  "return { marke: marke, roh: treffer }; })";

/* ---- #107: Ausrichtung der Zahlspalten, Kopf gegen Zelle ---- */
const AUSRICHTCODE = "(function () {" +
  "function tab(id) {" +
  "  var k = document.getElementById(id); if (!k) return { fehlt: true };" +
  "  var t = k.querySelector('table'); if (!t) return { fehlt: false, tabelle: false };" +
  "  var kopf = t.rows[0];" +
  "  var koepfe = Array.prototype.map.call(kopf.cells, function (c) {" +
  "    return { t: (c.innerText || '').replace(/\\s+/g,' ').trim().slice(0,26)," +
  "      klasse: c.className || '', a: getComputedStyle(c).textAlign }; });" +
  "  var zellen = [];" +
  "  Array.prototype.forEach.call(t.querySelectorAll('td'), function (c) {" +
  "    if (!/\\b(num|zahl)\\b/.test(c.className || '')) return;" +
  "    var s = getComputedStyle(c);" +
  "    zellen.push({ t: (c.innerText || '').trim().slice(0,18), klasse: c.className," +
  "      a: s.textAlign, ziffern: s.fontVariantNumeric, umbruch: s.whiteSpace }); });" +
  "  var linksbuendig = zellen.filter(function (z) { return z.a !== 'right' && z.a !== 'end'; });" +
  "  return { fehlt: false, tabelle: true, koepfe: koepfe," +
  "    zahlzellen: zellen.length, linksbuendig: linksbuendig.length," +
  "    beispiele: zellen.slice(0, 4) }; }" +
  "return { scoreboard: tab('scoreboard'), archiv: tab('archivKarte') }; })()";

/* ---- #108 / #105: der Wortlaut des Messbands ---- */
const BANDCODE = "(function () {" +
  "var k = document.getElementById('messband'); if (!k) return { fehlt: true };" +
  "var t = (k.innerText || '').replace(/\\s+/g, ' ').trim();" +
  /* Englische Dezimalzahl: Ziffer PUNKT Ziffer, aber kein Tausenderpunkt (der steht
   * vor genau drei Ziffern) und kein Datum. */
  "var eng = (t.match(/[0-9]+\\.[0-9]+/g) || []).filter(function (s) {" +
  "  return !/^[0-9]{1,3}\\.[0-9]{3}$/.test(s); });" +
  "var bindestrich = (t.match(/(^|[\\s(>])-[0-9]/g) || []);" +
  "var minus = (t.match(/\\u2212/g) || []);" +
  "var huerde = (t.match(/Kostenhürde ([0-9.,]+) Pp/) || [])[1] || null;" +
  "var live = null;" +
  "try { var h = window.DepotAPI && window.DepotAPI.kostenHuerde ? window.DepotAPI.kostenHuerde() : null;" +
  "  live = h ? h.pp : null; } catch (e) { live = 'Fehler'; }" +
  "return { fehlt: false, text: t.slice(0, 700), englischeZahlen: eng," +
  "  bindestrichMinus: bindestrich.length, echtesMinus: minus.length," +
  "  huerdeImText: huerde, huerdeLive: live }; })()";

/* ---- #101-Familie im dunklen Thema: traegt eine Farbklasse ausserhalb ihres
 * Eltern-Kastens Farbe? Gemessen wird gegen die Tokenwerte, nicht gegen ein
 * Wunschbild - ein Vergleich mit 'schwarz' waere im Dunkeln sinnlos. ---- */
const FARBCODE = "(function () {" +
  "function token(name) { var p = document.createElement('span');" +
  "  p.style.color = 'var(' + name + ')'; p.style.position = 'absolute'; p.textContent = '.';" +
  "  document.body.appendChild(p); var c = getComputedStyle(p).color; p.remove(); return c; }" +
  "var soll = { down: token('--down'), up: token('--up'), ink: token('--ink'), muted: token('--muted') };" +
  "var traeger = [];" +
  "Array.prototype.forEach.call(document.querySelectorAll('.down, .up'), function (el) {" +
  "  var s = getComputedStyle(el);" +
  "  if (s.display === 'none' || !el.offsetParent) return;" +
  "  var istDown = /\\bdown\\b/.test(el.className);" +
  "  traeger.push({ t: (el.innerText || '').trim().slice(0, 24), klasse: el.className," +
  "    farbe: s.color, erwartet: istDown ? soll.down : soll.up," +
  "    stimmt: s.color === (istDown ? soll.down : soll.up)," +
  "    wo: el.closest('[id]') ? '#' + el.closest('[id]').id : '?' }); });" +
  "var hg = getComputedStyle(document.body).backgroundColor;" +
  "return { thema: document.documentElement.getAttribute('data-theme') ||" +
  "    (document.body.className || '').slice(0, 40) || '(kein Merkmal)'," +
  "  hintergrund: hg, tokens: soll, traeger: traeger," +
  "  falsch: traeger.filter(function (x) { return !x.stimmt; }) }; })()";

/* ---- Kontrast: Text gegen seinen eigenen Hintergrund, WCAG-Verhaeltnis ---- */
const KONTRASTCODE = "(function () {" +
  "function rgb(s) { var m = (s || '').match(/[0-9.]+/g); return m ? m.slice(0,3).map(Number) : null; }" +
  "function lum(c) { var a = c.map(function (v) { v /= 255;" +
  "  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });" +
  "  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; }" +
  "function hintergrund(el) { var n = el;" +
  "  while (n && n.nodeType === 1) { var b = getComputedStyle(n).backgroundColor;" +
  "    var c = rgb(b); if (c && !/rgba\\(0, 0, 0, 0\\)|transparent/.test(b)) return c; n = n.parentElement; }" +
  "  return [255, 255, 255]; }" +
  "var schwach = [];" +
  "Array.prototype.forEach.call(document.querySelectorAll('td, th, b, span, p, li, a, button, div'), function (el) {" +
  "  if (el.children.length) return;" +
  "  var s = getComputedStyle(el);" +
  "  if (s.display === 'none' || !el.offsetParent) return;" +
  "  var t = (el.textContent || '').trim(); if (!t || t.length < 3) return;" +
  "  var vg = rgb(s.color); if (!vg) return;" +
  "  var hg = hintergrund(el);" +
  "  var l1 = lum(vg), l2 = lum(hg);" +
  "  var v = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);" +
  "  var gross = parseFloat(s.fontSize) >= 18.66 || (parseFloat(s.fontSize) >= 24);" +
  "  var grenze = gross ? 3.0 : 4.5;" +
  "  if (v < grenze) schwach.push({ t: t.slice(0, 40), v: Math.round(v * 100) / 100," +
  "    grenze: grenze, groesse: s.fontSize, farbe: s.color," +
  "    wo: el.closest('[id]') ? '#' + el.closest('[id]').id : '?' }); });" +
  "return { geprueft: document.querySelectorAll('td, th, b, span, p, li, a, button, div').length," +
  "  schwach: schwach.slice(0, 25), zahl: schwach.length }; })()";

async function js2(win, code) { return win.webContents.executeJavaScript(code, true); }
async function warte(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function schuss(win, name) {
  const bild = await win.webContents.capturePage();
  fs.writeFileSync(path.join(BILDER, name + '.png'), bild.toPNG());
}
async function reiter(win, tab, sub) {
  await js2(win, "(function(){var b=document.querySelector('nav.tabs [data-tab=\"" + tab + "\"]'); if(b) b.click();" +
    (sub ? "var s=document.querySelector('#tab-" + tab + " .pills [data-sub=\"" + sub + "\"]'); if(s) s.click();" : '') +
    "return 'ok';})()");
}

async function runde(win, marke) {
  const roh = [];
  win.setContentSize(1280, 800);
  await warte(600);

  await reiter(win, 'messung', null);
  await warte(3000);
  const ausricht = await js2(win, AUSRICHTCODE);
  roh.push(await js2(win, ROHCODE + '(' + JSON.stringify(marke + '/messung') + ')'));
  await schuss(win, marke + '-messung');
  const kontrast = await js2(win, KONTRASTCODE);

  await reiter(win, 'depot', 'depot');
  await warte(2500);
  const band = await js2(win, BANDCODE);
  roh.push(await js2(win, ROHCODE + '(' + JSON.stringify(marke + '/depot') + ')'));
  const farben = await js2(win, FARBCODE);
  await schuss(win, marke + '-messband');

  await reiter(win, 'strategien', 'regeln');
  await warte(2200);
  roh.push(await js2(win, ROHCODE + '(' + JSON.stringify(marke + '/regeln-uebersicht') + ')'));
  await schuss(win, marke + '-regeln-uebersicht');

  await reiter(win, 'werkzeuge', 'archiv');
  await warte(7000);
  const ausricht2 = await js2(win, AUSRICHTCODE);
  const archivText = await js2(win, "(function(){var k=document.getElementById('archivKarte');" +
    "return k ? (k.innerText||'').replace(/\\s+/g,' ').trim().slice(0,900) : null; })()");
  await schuss(win, marke + '-kursarchiv');

  return { marke, ausrichtMessung: ausricht, ausrichtArchiv: ausricht2,
    band, farben, kontrast, archivText,
    roh: roh.reduce((a, r) => a.concat((r && r.roh) || []), []) };
}

setTimeout(() => { console.error('Gegenprobe: Zeitlimit.'); app.exit(2); }, 900000);

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  const konsole = [];
  win.webContents.on('console-message', (e2, level, message) => {
    if (level >= 3) konsole.push(String(message).slice(0, 200));
  });
  let schonGelaufen = false;
  win.webContents.on('did-finish-load', async () => {
    if (schonGelaufen) return;
    schonGelaufen = true;
    try {
      await warte(6000);
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
      await warte(1000);
      await js2(win, "window.__f = []; window.addEventListener('error', function (e) { window.__f.push(String(e.message||e)); }); 'ok'");

      const hell = await runde(win, 'hell');

      /* Umschalten ueber den SPEICHER, nicht ueber den Hell/Dunkel-Knopf: derselbe
       * Weg, den die App beim Start nimmt, und kein Eingriff in Bedienelemente. */
      fs.writeFileSync(path.join(STORE, 'theme.json'), JSON.stringify('dark'), 'utf8');
      await js2(win, "location.reload(); 'neu'").catch(() => {});
      await warte(11000);
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
      await warte(1500);
      await js2(win, "window.__f = window.__f || []; 'ok'");

      const dunkel = await runde(win, 'dunkel');
      const fehler = await js2(win, 'window.__f.slice(0, 30)');

      const bericht = { stand: 'Arbeitsbaum == v8.34.0 an allen Funddateien (git diff leer)',
        protokolle: SAATZAHL, bilder: BILDER, hell, dunkel,
        seitenFehler: fehler || [], konsoleFehler: konsole.slice(0, 30) };
      fs.writeFileSync(path.join(TESTROOT, 'gegenprobe.json'), JSON.stringify(bericht, null, 1));
      console.log('BILDER=' + BILDER);
      console.log('BERICHT=' + path.join(TESTROOT, 'gegenprobe.json'));
      ['hell', 'dunkel'].forEach((m) => {
        const r = bericht[m];
        console.log('--- ' + m + ' (Hintergrund ' + (r.farben && r.farben.hintergrund) + ') ---');
        console.log('  #106 rohe Schluessel sichtbar: ' + r.roh.length);
        console.log('  #107 Scoreboard Zahlzellen: ' + (r.ausrichtMessung.scoreboard.zahlzellen || 0) +
          ', davon NICHT rechts: ' + (r.ausrichtMessung.scoreboard.linksbuendig));
        console.log('  #107 Archiv Zahlzellen: ' + (r.ausrichtArchiv.archiv.zahlzellen || 0) +
          ', davon NICHT rechts: ' + (r.ausrichtArchiv.archiv.linksbuendig));
        console.log('  #108 englische Zahlen im Band: ' + JSON.stringify(r.band.englischeZahlen) +
          ', Bindestrich-Minus: ' + r.band.bindestrichMinus + ', echtes Minus: ' + r.band.echtesMinus);
        console.log('  #105 Huerde im Text: ' + r.band.huerdeImText + ' | live: ' + r.band.huerdeLive);
        console.log('  Farbklassen falsch: ' + (r.farben.falsch || []).length + ' von ' + (r.farben.traeger || []).length);
        console.log('  Kontrast unter Grenze: ' + r.kontrast.zahl);
      });
      console.log('SEITENFEHLER=' + (fehler || []).length);
      app.exit(0);
    } catch (e) {
      console.error('Gegenprobe abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
