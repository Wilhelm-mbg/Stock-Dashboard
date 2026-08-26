'use strict';
/* ====== Auditor, vertiefte Probe (26.08.2026, zweiter Lauf) ======
 *
 * tools/ui-probe.js schaltet nur durch und zaehlt unbehandelte Fehler. Diese
 * Probe geht weiter: sie sieht nach, ob auf den Flaechen auch das RICHTIGE
 * steht - unfertige Werte im sichtbaren Text, waagerechter Ueberlauf, Inhalt
 * der aus seiner Karte laeuft, ueberlappende oder unsichtbar-bedienbare
 * Schaltflaechen, Knoepfe ohne zugaenglichen Namen - und macht von jedem
 * Reiter Bildschirmfotos in zwei Fenstergroessen.
 *
 * Aufruf aus der Repo-Wurzel:
 *   .\node_modules\.bin\electron.cmd studien\auditor\2026-08-26-lauf2\probe.js
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

/* ---- Saatgut: ohne eigene Papiere bleibt die neue Bestandstabelle leer ----
 * Der Schwerpunkt dieser Nacht ist genau diese Tabelle (#83/#89: die Signalliste
 * unter "Heute" ist entfallen, ihr Inhalt steht jetzt als zwei Spalten unter
 * Vermoegen -> Meine Papiere). Ein leeres Profil zeigt davon NICHTS - der erste
 * Lauf hat die neue Tabelle deshalb nur als Leerzustand gesehen.
 * Geschrieben wird ausschliesslich in das frische TESTROOT-Verzeichnis unter
 * %TEMP%: dieselbe Datei, die storeSet() schreiben wuerde, nur vorher. Der
 * Speicher des Anwenders wird nicht angefasst und nicht gelesen.
 * Vier Papiere mit Stueckzahl, damit auch die neue Summenzeile faellt; eines mit
 * langem Namen, weil Layout-Fehler an der laengsten Zelle zuerst auffallen. */
function saatLegen() {
  const d = path.join(TESTROOT, 'userdata', 'store');
  fs.mkdirSync(d, { recursive: true });
  const werte = [
    { sym: 'AAPL', name: 'Apple Inc.', stueck: 12, isin: 'US0378331005', wkn: null, seit: 1 },
    { sym: 'MSFT', name: 'Microsoft Corporation', stueck: 5, isin: 'US5949181045', wkn: null, seit: 1 },
    { sym: 'NVDA', name: 'NVIDIA Corporation', stueck: 40, isin: 'US67066G1040', wkn: null, seit: 1 },
    { sym: 'AMZN', name: 'Amazon.com Incorporated Registered Shares', stueck: 3, isin: 'US0231351067', wkn: null, seit: 1 }
  ];
  fs.writeFileSync(path.join(d, 'bestand.json'), JSON.stringify({ stand: 1, werte: werte }), 'utf8');
  /* Hell eingestellt - so laesst sich nebenbei ablesen, ob thema.js die
   * gespeicherte Wahl wirklich vor dem ersten Pixel setzt (Stufe F Punkt 1). */
  fs.writeFileSync(path.join(d, 'theme.json'), JSON.stringify('light'), 'utf8');
  console.log('SAAT=' + d);
}
saatLegen();

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

/* ---- Schwerpunkt: die Bestandstabelle Zelle fuer Zelle ----
 * Die allgemeine Messung sieht Ueberlauf und unfertige Werte. Sie sieht NICHT,
 * ob eine Zeile so viele Zellen hat wie die Kopfzeile - und genau daran scheitert
 * eine umgebaute Tabelle: die neue Summenzeile muss zehn Zellen fuellen, sonst
 * verrutscht die ganze Spaltenlogik. Also wird hier ausgezaehlt statt geschaut. */
const TABELLENCODE = "(function () {" +
  "var k = document.getElementById('bestandTabelle');" +
  "if (!k) return { fehlt: true };" +
  "var t = k.querySelector('table');" +
  "if (!t) return { fehlt: false, tabelle: false, text: (k.innerText || '').trim().slice(0, 300) };" +
  "var zeilen = Array.prototype.map.call(t.rows, function (r) {" +
  "  return { zellen: r.cells.length, klasse: r.className || ''," +
  "    inhalt: Array.prototype.map.call(r.cells, function (c) {" +
  "      return { t: (c.innerText || '').trim().slice(0, 60), c: c.className || '' }; }) }; });" +
  "var r = t.getBoundingClientRect(), pr = k.getBoundingClientRect();" +
  "var zeilenText = (k.innerText || '').split(String.fromCharCode(10));" +
  "return { fehlt: false, tabelle: true, zeilen: zeilen," +
  "  breiteTabelle: Math.round(r.width), breiteKasten: Math.round(pr.width)," +
  "  rollbar: k.scrollWidth > k.clientWidth + 2," +
  "  ueberKasten: Math.round(r.right - pr.right)," +
  "  fusstext: (zeilenText[zeilenText.length - 1] || '').slice(0, 200) }; })()";

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

async function js2(win, code) { return win.webContents.executeJavaScript(code, true); }

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
      /* Nebenbefund, kein Schwerpunkt: hat thema.js die gespeicherte Wahl wirklich
       * gesetzt? Zu diesem Zeitpunkt kann auch der asynchrone Weg in renderer.js
       * schon gegriffen haben - deshalb wird BEIDES abgelesen, das Startargument
       * und das Ergebnis. Ein fehlendes Startargument bei hell gesetztem Speicher
       * waere der Blitz von frueher. */
      const thema = await win.webContents.executeJavaScript(
        "({ start: (window.api && window.api.startThema) || null," +
        " gesetzt: document.documentElement.getAttribute('data-theme') })", true);
      console.log('THEMA=' + JSON.stringify(thema));

      const erg = await lauf(win);

      /* ---- Schwerpunkt: Vermoegen -> Meine Papiere, in beiden Groessen ----
       * Nach dem Reiterwechsel wird laenger gewartet als sonst: jahresbasenLaden()
       * holt je Papier eine Tagesreihe ueber ein Jahr und zeichnet ERST DANACH neu.
       * Wer zu frueh misst, sieht die Spalte "seit Jahresbeginn" leer und haelt das
       * fuer einen Fund. */
      const tabellen = [];
      for (const paar of [[1280, 800], [1000, 700]]) {
        win.setContentSize(paar[0], paar[1]);
        await warte(700);
        await js2(win, "(function(){var b=document.querySelector('nav.tabs [data-tab=\"depot\"]'); if(b) b.click();" +
          "var s=document.querySelector('#tab-depot .pills [data-sub=\"papiere\"]'); if(s) s.click(); return 'ok';})()");
        await warte(9000);
        const m = await js2(win, TABELLENCODE);
        m.groesse = paar[0] + 'x' + paar[1];
        tabellen.push(m);
        const marke = 'depot/papiere-gefuellt @' + paar[0] + 'x' + paar[1];
        aufnehmenAlle(await js2(win, MESSCODE + '(' + JSON.stringify(marke) + ')'));
        await schuss(win, 'papiere-gefuellt-' + paar[0]);
      }
      /* Und der Reiter Heute: dort ist die Signalliste entfallen - steht an ihrer
       * Stelle jetzt eine Luecke oder schliesst die Seite sauber? */
      win.setContentSize(1280, 800);
      await warte(600);
      await js2(win, "(function(){var b=document.querySelector('nav.tabs [data-tab=\"dashboard\"]'); if(b) b.click();" +
        "var s=document.querySelector('#tab-dashboard .pills [data-sub=\"ueberblick\"]'); if(s) s.click(); return 'ok';})()");
      await warte(2500);
      await schuss(win, 'heute-ohne-signalliste-1280');
      /* Gegenprobe zum Fund der letzten Nacht (#90): bei "Bewegung reduzieren"
       * stand das Laufband still UND war nicht schiebbar - drei von sechs
       * Schlagzeilen dauerhaft unerreichbar. Der Reparaturstand liegt in dieser
       * Aenderungsmenge, also wird er nachgemessen statt geglaubt. */
      const laufband = await js2(win, "(function () {" +
        "var t = document.getElementById('newsTicker'); if (!t) return { da: false };" +
        "var sp = t.querySelector('.tickSpur');" +
        "var cs = getComputedStyle(t);" +
        "return { da: true, ruhig: !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)," +
        "  sichtbar: cs.display !== 'none', overflowX: cs.overflowX," +
        "  schiebbar: t.scrollWidth > t.clientWidth + 2," +
        "  spurBreite: sp ? Math.round(sp.scrollWidth) : null, rahmen: Math.round(t.clientWidth)," +
        "  links: t.querySelectorAll('a').length," +
        "  animation: sp ? getComputedStyle(sp).animationName : null," +
        "  titel: (t.getAttribute('title') || '').slice(0, 120) }; })()");
      console.log('LAUFBAND=' + JSON.stringify(laufband));

      const restBestandListe = await js2(win, "!!document.getElementById('bestandListe')");
      console.log('BESTANDLISTE_NOCH_DA=' + restBestandListe);

      const bericht = {
        bilder: BILDER,
        tabs: erg.tabs,
        thema: thema,
        bestandListeNochDa: restBestandListe,
        laufband: laufband,
        tabellen: tabellen,
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
