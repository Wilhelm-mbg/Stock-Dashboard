'use strict';
/* ============ Auditor, vertiefte Probe (Nacht auf 26.08.2026) ============
 *
 * tools/ui-probe.js schaltet nur durch und zaehlt unbehandelte Fehler. Diese
 * Probe geht weiter: sie sieht nach, ob auf den Flaechen auch das RICHTIGE
 * steht - unfertige Werte im sichtbaren Text, waagerechter Ueberlauf, Inhalt
 * der aus seiner Karte laeuft, ueberlappende oder unsichtbar-bedienbare
 * Schaltflaechen, Knoepfe ohne zugaenglichen Namen - und macht von jedem
 * Reiter Bildschirmfotos in zwei Fenstergroessen.
 *
 * Aufruf aus der Repo-Wurzel:
 *   .\node_modules\.bin\electron.cmd studien\auditor\2026-08-26\probe.js
 *
 * Der Vorspann ist der aus tools/ui-probe.js - er ist der Grund, warum die
 * Probe die echte Installation nicht anfasst. ACHTUNG: WURZEL geht von hier
 * DREI Ebenen hoch, nicht eine.
 *
 * Geklickt wird ausschliesslich Navigation (Reiter und Pillen). Kein Knopf,
 * der handelt, zuruecksetzt, laeuft oder kostet - siehe Sperrliste im Auftrag. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..', '..', '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-auditor-'));
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

const BILDER = path.join(TESTROOT, 'bilder');
fs.mkdirSync(BILDER, { recursive: true });

/* Die Messung laeuft IN der Seite. Sie liest nur - kein click, kein Schreiben. */
const MESSCODE = '(function (marke) {' +
  'var raus = { marke: marke, unfertig: [], ueberlauf: [], ausgelaufen: [],' +
  ' ueberlappung: [], unsichtbarBedienbar: [], ohneNamen: [], leerekarten: [] };' +
  'function sichtbar(el) {' +
  '  var s = getComputedStyle(el);' +
  '  if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") return false;' +
  '  var r = el.getBoundingClientRect();' +
  '  return !!(el.offsetParent || s.position === "fixed") && r.width >= 0 && r.height >= 0; }' +
  'function kurz(el) {' +
  '  var t = (el.id ? "#" + el.id : "") + (el.className && typeof el.className === "string" ?' +
  '    "." + el.className.trim().split(/\\s+/).slice(0, 2).join(".") : "");' +
  '  return (el.tagName.toLowerCase() + t).slice(0, 80); }' +
  'function pfad(el) {' +
  '  var out = [], n = el, i = 0;' +
  '  while (n && n.nodeType === 1 && i < 4) { out.unshift(kurz(n)); n = n.parentElement; i++; }' +
  '  return out.join(" > "); }' +
  /* --- 1. unfertige Werte im SICHTBAREN Text --- */
  'var muster = /(^|[^A-Za-z0-9_])(NaN|undefined|null|Infinity|-Infinity|\\[object Object\\])([^A-Za-z0-9_]|$)/;' +
  'var lauf = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);' +
  'var kn; var gesehen = 0;' +
  'while ((kn = lauf.nextNode()) && gesehen < 4000) {' +
  '  gesehen++;' +
  '  var txt = kn.nodeValue; if (!txt || !muster.test(txt)) continue;' +
  '  var el = kn.parentElement; if (!el || !sichtbar(el)) continue;' +
  '  if (el.closest("script, style, template")) continue;' +
  '  raus.unfertig.push({ text: txt.trim().slice(0, 120), wo: pfad(el) }); }' +
  /* --- 2. waagerechter Ueberlauf: Dokument und je Karte --- */
  'var de = document.documentElement;' +
  'if (de.scrollWidth > de.clientWidth + 1) raus.ueberlauf.push({ wo: "document", ist: de.scrollWidth, soll: de.clientWidth });' +
  'Array.prototype.forEach.call(document.querySelectorAll(".panel, .card, .kachel"), function (el) {' +
  '  if (!sichtbar(el)) return;' +
  '  var s = getComputedStyle(el);' +
  '  if (s.overflowX === "auto" || s.overflowX === "scroll") return;' +
  '  if (el.scrollWidth > el.clientWidth + 2) raus.ueberlauf.push({ wo: pfad(el), ist: el.scrollWidth, soll: el.clientWidth }); });' +
  /* --- 3. Inhalt, der aus seiner Karte laeuft --- */
  'Array.prototype.forEach.call(document.querySelectorAll(".panel, .card, .kachel"), function (el) {' +
  '  if (!sichtbar(el)) return;' +
  '  var s = getComputedStyle(el);' +
  '  if (s.overflow !== "visible" || s.overflowX !== "visible") return;' +
  '  var pr = el.getBoundingClientRect(); if (pr.width < 5) return;' +
  '  Array.prototype.forEach.call(el.children, function (k) {' +
  '    if (!sichtbar(k)) return;' +
  '    var ks = getComputedStyle(k); if (ks.position === "absolute" || ks.position === "fixed") return;' +
  '    var kr = k.getBoundingClientRect(); if (kr.width < 2) return;' +
  '    if (kr.right > pr.right + 2 || kr.left < pr.left - 2) {' +
  '      raus.ausgelaufen.push({ wo: pfad(k), in: kurz(el),' +
  '        ueber: Math.round(Math.max(kr.right - pr.right, pr.left - kr.left)) }); } }); });' +
  /* --- 4. ueberlappende sichtbare Geschwister-Bedienelemente --- */
  'var bedien = Array.prototype.filter.call(document.querySelectorAll("button, a[href], select, input"), function (el) {' +
  '  if (!sichtbar(el)) return false; var r = el.getBoundingClientRect();' +
  '  return r.width > 0 && r.height > 0; });' +
  'for (var a = 0; a < bedien.length; a++) { for (var b = a + 1; b < bedien.length; b++) {' +
  '  var x = bedien[a], y = bedien[b];' +
  '  if (x.parentElement !== y.parentElement) continue;' +
  '  var rx = x.getBoundingClientRect(), ry = y.getBoundingClientRect();' +
  '  var ux = Math.min(rx.right, ry.right) - Math.max(rx.left, ry.left);' +
  '  var uy = Math.min(rx.bottom, ry.bottom) - Math.max(rx.top, ry.top);' +
  '  if (ux > 2 && uy > 2) raus.ueberlappung.push({ a: kurz(x), b: kurz(y),' +
  '    flaeche: Math.round(ux) + "x" + Math.round(uy) }); } }' +
  /* --- 5. sichtbar ausgewiesen, aber Groesse 0 oder ausserhalb des Fensters --- */
  'Array.prototype.forEach.call(document.querySelectorAll("button, a[href], [role=button]"), function (el) {' +
  '  if (!sichtbar(el)) return;' +
  '  var r = el.getBoundingClientRect();' +
  '  if (r.width < 1 || r.height < 1) { raus.unsichtbarBedienbar.push({ wo: pfad(el), grund: "Groesse 0" }); return; }' +
  '  if (r.right < 0 || r.bottom < 0 || r.left > de.clientWidth + 400) {' +
  '    raus.unsichtbarBedienbar.push({ wo: pfad(el), grund: "ausserhalb: left=" + Math.round(r.left) }); } });' +
  /* --- 6. Barrierefreiheit: kein zugaenglicher Name --- */
  'Array.prototype.forEach.call(document.querySelectorAll("button, a[href], [role=button]"), function (el) {' +
  '  if (!sichtbar(el)) return;' +
  '  var r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return;' +
  '  var name = (el.textContent || "").trim() || (el.getAttribute("aria-label") || "").trim() ||' +
  '    (el.getAttribute("title") || "").trim();' +
  '  if (!name && el.getAttribute("aria-labelledby")) {' +
  '    var z = document.getElementById(el.getAttribute("aria-labelledby"));' +
  '    if (z) name = (z.textContent || "").trim(); }' +
  '  if (!name) raus.ohneNamen.push({ wo: pfad(el) }); });' +
  /* --- 7. Karten, die nur aus Ueberschrift bestehen (Leerzustand fehlt) --- */
  'Array.prototype.forEach.call(document.querySelectorAll(".panel, .card"), function (el) {' +
  '  if (!sichtbar(el)) return;' +
  '  var t = (el.innerText || "").trim();' +
  '  var hatBedien = el.querySelector("button, input, select, canvas, table, svg, img");' +
  '  if (!t && !hatBedien) raus.leerekarten.push({ wo: pfad(el) }); });' +
  'raus.warnband = ((document.getElementById("warnband") || {}).innerText || "").trim().slice(0, 300);' +
  /* Diagnosezaehler: ein "0 Funde" ist nur dann etwas wert, wenn die Pruefung auch
   * wirklich Elemente gesehen hat. Sonst meldet eine kaputte Pruefung Ruhe. */
  'raus.geprueft = { bedienelemente: bedien.length,' +
  '  namenskandidaten: document.querySelectorAll("button, a[href], [role=button]").length,' +
  '  karten: document.querySelectorAll(".panel, .card, .kachel").length };' +
  'raus.modalOffen = !!document.querySelector(".modal-bg.open");' +
  'return raus; })';

const funde = [];
const konsoleFehler = [];

function schluessel(o) { return JSON.stringify(o); }

/* Vieles steht auf jedem Reiter (Kopfzeile, Warnband). Ohne Entdopplung meldet
 * die Probe denselben Knopf 21-mal. Der erste Fundort gewinnt. */
const schonGesehen = Object.create(null);
function aufnehmen(marke, art, liste) {
  (liste || []).forEach((e) => {
    const k = art + '|' + schluessel(e);
    if (schonGesehen[k]) return;
    schonGesehen[k] = marke;
    funde.push({ marke, art, e });
  });
}

async function warte(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function schuss(win, name) {
  const bild = await win.webContents.capturePage();
  const ziel = path.join(BILDER, name + '.png');
  fs.writeFileSync(ziel, bild.toPNG());
  return ziel;
}

async function lauf(win) {
  const wc = win.webContents;
  const js = (code) => wc.executeJavaScript(code, true);
  await js("window.__auditor = { fehler: [] };" +
    "window.addEventListener('error', function (e) { window.__auditor.fehler.push(String(e.message || e)); });" +
    "window.addEventListener('unhandledrejection', function (e) { window.__auditor.fehler.push('unhandled: ' + String(e.reason && e.reason.message || e.reason)); });" +
    "'bereit'");

  const tabs = await js("Array.prototype.map.call(document.querySelectorAll('nav.tabs button[data-tab]'), function (b) { return b.getAttribute('data-tab'); })");
  if (!tabs || !tabs.length) throw new Error('keine Reiter gefunden');

  const groessen = [[1280, 800], [1000, 700]];
  for (const [br, ho] of groessen) {
    win.setContentSize(br, ho);
    await warte(900);
    const g = br + 'x' + ho;
    for (const tab of tabs) {
      await js("(document.querySelector('nav.tabs [data-tab=\"" + tab + "\"]') || {}).click && document.querySelector('nav.tabs [data-tab=\"" + tab + "\"]').click(), 'ok'");
      await warte(700);
      aufnehmenAlle(await js(MESSCODE + '(' + JSON.stringify(tab + ' @' + g) + ')'));
      await schuss(win, g + '__' + tab);

      const subs = await js("Array.prototype.map.call(document.querySelectorAll('#tab-" + tab + " .pills button[data-sub]'), function (b) { return b.getAttribute('data-sub'); })");
      for (const sub of (subs || [])) {
        await js("(function(){var b=document.querySelector('#tab-" + tab + " .pills [data-sub=\"" + sub + "\"]'); if(b) b.click(); return 'ok';})()");
        await warte(600);
        aufnehmenAlle(await js(MESSCODE + '(' + JSON.stringify(tab + '/' + sub + ' @' + g) + ')'));
        /* Pillen nur in der schmalen Groesse fotografieren - dort faellt fast
         * jeder Layout-Fehler zuerst auf, und das Repo bleibt schlank. */
        if (br === 1000) await schuss(win, g + '__' + tab + '__' + sub);
      }
    }
  }
  const seitenFehler = await js('window.__auditor.fehler.slice(0, 30)');
  return { tabs: tabs.length, seitenFehler: seitenFehler || [] };
}

function aufnehmenAlle(m) {
  if (!m) return;
  aufnehmen(m.marke, 'unfertig', m.unfertig);
  aufnehmen(m.marke, 'ueberlauf', m.ueberlauf);
  aufnehmen(m.marke, 'ausgelaufen', m.ausgelaufen);
  aufnehmen(m.marke, 'ueberlappung', m.ueberlappung);
  aufnehmen(m.marke, 'unsichtbarBedienbar', m.unsichtbarBedienbar);
  aufnehmen(m.marke, 'ohneNamen', m.ohneNamen);
  aufnehmen(m.marke, 'leerekarten', m.leerekarten);
}

setTimeout(() => { console.error('Auditor-Probe: Zeitlimit erreicht.'); app.exit(2); }, 600000);

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  win.webContents.on('console-message', (e2, level, message) => {
    if (level >= 3) konsoleFehler.push(String(message).slice(0, 220));
  });
  win.webContents.once('did-finish-load', async () => {
    try {
      await warte(5000);
      /* Beim allerersten Start liegt die Einwilligungsfrage (Diagnosedaten) als
       * Dialog ueber der halben Flaeche - jedes Bildschirmfoto waere verdeckt.
       * Sie wird NICHT beantwortet: diagnose.js haelt ausdruecklich fest, dass
       * Wegklicken ohne Antwort erlaubt ist und weiterhin bedeutet, dass nichts
       * gesendet wird. Ein echter Escape-Tastendruck, kein Knopfklick. */
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
      await warte(800);
      const nochOffen = await win.webContents.executeJavaScript(
        "!!document.querySelector('.modal-bg.open')", true);
      console.log('MODAL_NACH_ESCAPE=' + nochOffen);
      const erg = await lauf(win);
      const bericht = {
        bilder: BILDER,
        tabs: erg.tabs,
        seitenFehler: erg.seitenFehler,
        konsoleFehler: konsoleFehler.slice(0, 40),
        funde
      };
      fs.writeFileSync(path.join(TESTROOT, 'befund.json'), JSON.stringify(bericht, null, 1));
      console.log('BILDER=' + BILDER);
      console.log('BEFUNDDATEI=' + path.join(TESTROOT, 'befund.json'));
      const zaehl = Object.create(null);
      funde.forEach((f) => { zaehl[f.art] = (zaehl[f.art] || 0) + 1; });
      console.log('ZUSAMMENFASSUNG=' + JSON.stringify(zaehl));
      console.log('SEITENFEHLER=' + erg.seitenFehler.length);
      erg.seitenFehler.slice(0, 10).forEach((f) => console.log('  ! ' + f));
      app.exit(0);
    } catch (e) {
      console.error('Auditor-Probe abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
