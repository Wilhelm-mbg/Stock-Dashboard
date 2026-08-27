'use strict';
/* ====== Auditor, Nachtrag: die zwei Nullbefunde absichern (27.08.2026, 08:30) ======
 *
 * Die Gegenprobe hat im dunklen Thema zwei Nullen gemeldet, und BEIDE waren
 * wertlos, solange sie nicht abgesichert sind:
 *
 *  1. FARBKLASSEN (#101-Familie): "0 falsch von 0 Traegern". Es gab gar keine
 *     .down/.up-Elemente, weil das isolierte Depot leer ist - der Depotverlauf-Kopf
 *     versteckt sich unter 5 Punkten selbst. Gemessen wurde also nichts.
 *     Abhilfe: Verlaufskurve SAEEN, dann traegt "Max. Ruecksetzer" die Klasse.
 *  2. KONTRAST: "0 unter der Grenze bei 1.747 geprueften Elementen". Das kann
 *     heissen, dass alles reicht - oder dass meine Leuchtdichte-Rechnung falsch
 *     ist. Abhilfe: ein absichtlich zu blasses Element einhaengen und pruefen, ob
 *     der Pruefer es FINDET. Findet er es nicht, ist die Null nichts wert.
 *
 * Das ist dieselbe Regel, an der diese Nacht schon zweimal etwas zurueckgenommen
 * werden musste: ein Nullbefund ohne Positivkontrolle ist kein Befund.
 *
 * Aufruf aus der Repo-Wurzel:
 *   .\node_modules\.bin\electron.cmd studien\auditor\2026-08-27\probe-dunkel-positivkontrolle.js
 *
 * ACHTUNG: WURZEL geht von hier DREI Ebenen hoch. Geklickt wird nur Navigation.
 * NICHTS wird ins Repo geschrieben - das Auspacken heute frueh hat gezeigt, wohin
 * das fuehrt. Alles nach %TEMP%. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..', '..', '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-auditor-pk-'));
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
fs.mkdirSync(STORE, { recursive: true });
fs.writeFileSync(path.join(STORE, 'theme.json'), JSON.stringify('dark'), 'utf8');
const BILDER = path.join(TESTROOT, 'bilder');
fs.mkdirSync(BILDER, { recursive: true });

/* Verlauf saeen - NICHT von Hand zusammengebaut, sondern der Stand, den die App
 * selbst geschrieben hat, um EIN Feld ergaenzt. Anstieg, Hoch, echter Ruecksetzer:
 * nur so traegt "Max. Ruecksetzer" eine Zahl ungleich null und die Klasse "down". */
const SAATCODE = "(async function () {" +
  "var d = await window.api.storeGet('depot');" +
  "if (!d) return { ok: false, grund: 'kein depot im Speicher' };" +
  "var t0 = 1750000000000, punkte = [];" +
  "var kurve = [0, 1.5, 3.1, 4.6, 6.2, 8.9, 11.4, 9.0, 6.1, 3.4, 4.2, 5.0, 5.6, 6.1, 7.3];" +
  "for (var i = 0; i < kurve.length; i++) {" +
  "  punkte.push([t0 + i * 600000, Math.round(100000 * (1 + kurve[i] / 100) * 100) / 100]); }" +
  "d.equityHist = punkte;" +
  "var r = await window.api.storeSet('depot', d);" +
  "return { ok: !(r && r.ok === false), punkte: punkte.length }; })()";

/* Der Kontrast-Pruefer, wortgleich mit dem der Gegenprobe - plus die Moeglichkeit,
 * vorher einen absichtlich zu blassen Fall einzuhaengen. */
const KONTRAST = "(function (mitKoeder) {" +
  "var koeder = null;" +
  "if (mitKoeder) {" +
  "  koeder = document.createElement('div');" +
  "  koeder.id = 'auditorKoeder';" +
  /* Grauer Text auf fast gleichem Grau: Verhaeltnis ~1,6 - muss auffallen. */
  "  koeder.style.cssText = 'position:fixed; left:8px; bottom:8px; z-index:9999;" +
  "    background:#808080; color:#8a8a8a; font-size:13px; padding:4px;';" +
  "  koeder.textContent = 'Koeder fuer die Positivkontrolle';" +
  "  document.body.appendChild(koeder); }" +
  "function rgb(s) { var m = (s || '').match(/[0-9.]+/g); return m ? m.slice(0,3).map(Number) : null; }" +
  "function lum(c) { var a = c.map(function (v) { v /= 255;" +
  "  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });" +
  "  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; }" +
  "function hintergrund(el) { var n = el;" +
  "  while (n && n.nodeType === 1) { var b = getComputedStyle(n).backgroundColor;" +
  "    var c = rgb(b); if (c && !/rgba\\(0, 0, 0, 0\\)|transparent/.test(b)) return c; n = n.parentElement; }" +
  "  return [255, 255, 255]; }" +
  "var schwach = [], geprueft = 0, koederGefunden = false;" +
  /* SICHTBARKEIT NICHT UEBER offsetParent. Der ist bei position:fixed IMMER null -
   * der erste Wurf dieser Probe hat damit jedes feste Element uebersprungen, und
   * zwar stillschweigend. Aufgefallen ist es nur, weil der Koeder selbst fixed war
   * und nicht gefunden wurde. Gemessen wird jetzt am Rechteck. */
  "function sichtbar(el) { var s = getComputedStyle(el);" +
  "  if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;" +
  "  var r = el.getBoundingClientRect();" +
  "  return r.width > 0 && r.height > 0; }" +
  "Array.prototype.forEach.call(document.querySelectorAll('td, th, b, span, p, li, a, button, div'), function (el) {" +
  "  if (el.children.length) return;" +
  "  var s = getComputedStyle(el);" +
  "  if (!sichtbar(el)) return;" +
  "  var t = (el.textContent || '').trim(); if (!t || t.length < 3) return;" +
  "  var vg = rgb(s.color); if (!vg) return;" +
  "  geprueft++;" +
  "  var hg = hintergrund(el);" +
  "  var l1 = lum(vg), l2 = lum(hg);" +
  "  var v = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);" +
  "  var gross = parseFloat(s.fontSize) >= 18.66;" +
  "  var grenze = gross ? 3.0 : 4.5;" +
  "  if (v < grenze) { if (el.id === 'auditorKoeder') koederGefunden = true;" +
  "    else schwach.push({ t: t.slice(0, 40), v: Math.round(v * 100) / 100," +
  "      grenze: grenze, farbe: s.color, wo: el.closest('[id]') ? '#' + el.closest('[id]').id : '?' }); } });" +
  "if (koeder) koeder.remove();" +
  "return { geprueft: geprueft, schwach: schwach.slice(0, 20), zahl: schwach.length," +
  "  koederGesetzt: !!mitKoeder, koederGefunden: koederGefunden }; })";

/* Die Farbklassen - mit Zaehlung der Traeger, damit eine Null lesbar bleibt. */
const FARBEN = "(function () {" +
  "function token(name) { var p = document.createElement('span');" +
  "  p.style.color = 'var(' + name + ')'; p.style.position = 'absolute'; p.textContent = '.';" +
  "  document.body.appendChild(p); var c = getComputedStyle(p).color; p.remove(); return c; }" +
  "var soll = { down: token('--down'), up: token('--up') };" +
  "var traeger = [];" +
  /* DIE KLASSEN HEISSEN pos/neg, nicht up/down. U.signCls (app-shell.js:26) gibt
   * 'pos'/'neg' aus; die Reparatur von #101 in der Nacht auf den 27.08. hat den
   * Ruecksetzer darauf umgestellt. Mein erster Wurf suchte '.down, .up', fand
   * folgerichtig NULL Traeger und meldete "0 von 0 falsch" - eine Null, die nur
   * aussagte, dass ich den falschen Namen gesucht hatte. Beide Namen stehen jetzt
   * da, damit die Probe auch alte Stellen findet. */
  "Array.prototype.forEach.call(document.querySelectorAll('.pos, .neg, .down, .up'), function (el) {" +
  "  var s = getComputedStyle(el);" +
  "  var r = el.getBoundingClientRect();" +
  "  if (s.display === 'none' || r.width === 0 || r.height === 0) return;" +
  "  var istDown = /\\b(neg|down)\\b/.test(el.className);" +
  "  traeger.push({ t: (el.innerText || '').trim().slice(0, 30), klasse: el.className," +
  "    farbe: s.color, erwartet: istDown ? soll.down : soll.up," +
  "    stimmt: s.color === (istDown ? soll.down : soll.up)," +
  "    wo: el.closest('[id]') ? '#' + el.closest('[id]').id : '?' }); });" +
  "var kopf = document.getElementById('eqKopf');" +
  "return { tokens: soll, traeger: traeger," +
  "  falsch: traeger.filter(function (x) { return !x.stimmt; })," +
  "  eqKopfDa: !!kopf, eqKopfText: kopf ? (kopf.innerText||'').replace(/\\s+/g,' ').slice(0,200) : null }; })()";

async function js2(win, code) { return win.webContents.executeJavaScript(code, true); }
async function warte(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function reiter(win, tab, sub) {
  await js2(win, "(function(){var b=document.querySelector('nav.tabs [data-tab=\"" + tab + "\"]'); if(b) b.click();" +
    (sub ? "var s=document.querySelector('#tab-" + tab + " .pills [data-sub=\"" + sub + "\"]'); if(s) s.click();" : '') +
    "return 'ok';})()");
}

setTimeout(() => { console.error('Positivkontrolle: Zeitlimit.'); app.exit(2); }, 600000);

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
      await warte(1000);

      const saat = await js2(win, SAATCODE);
      console.log('SAAT=' + JSON.stringify(saat));
      await js2(win, "location.reload(); 'neu'").catch(() => {});
      await warte(11000);
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
      await warte(1500);

      win.setContentSize(1280, 800);
      await reiter(win, 'depot', 'depot');
      await warte(3000);

      const farben = await js2(win, FARBEN);
      const ohne = await js2(win, KONTRAST + '(false)');
      const mit = await js2(win, KONTRAST + '(true)');
      const bild = await win.webContents.capturePage();
      fs.writeFileSync(path.join(BILDER, 'dunkel-depotverlauf.png'), bild.toPNG());

      const bericht = { thema: 'dark', saat, farben, kontrastOhneKoeder: ohne, kontrastMitKoeder: mit };
      fs.writeFileSync(path.join(TESTROOT, 'positivkontrolle.json'), JSON.stringify(bericht, null, 1));
      console.log('BILDER=' + BILDER);
      console.log('BERICHT=' + path.join(TESTROOT, 'positivkontrolle.json'));
      console.log('--- Farbklassen (dunkel) ---');
      console.log('  Traeger gefunden: ' + farben.traeger.length + '  (Positivkontrolle ' +
        (farben.traeger.length ? 'JA' : 'NEIN') + ')');
      console.log('  Tokens: ' + JSON.stringify(farben.tokens));
      farben.traeger.forEach((t) => console.log('   ' + (t.stimmt ? 'ok  ' : 'FALSCH ') +
        JSON.stringify(t.t) + ' klasse=' + t.klasse + ' ist=' + t.farbe + ' soll=' + t.erwartet + ' in ' + t.wo));
      console.log('  eqKopf: ' + JSON.stringify(farben.eqKopfText));
      console.log('--- Kontrast (dunkel) ---');
      console.log('  geprueft ' + ohne.geprueft + ', unter Grenze ' + ohne.zahl);
      console.log('  KOEDER gefunden: ' + mit.koederGefunden + '  (muss true sein, sonst ist die Null wertlos)');
      ohne.schwach.slice(0, 8).forEach((s) => console.log('   ! ' + JSON.stringify(s.t) + ' v=' + s.v + ' in ' + s.wo));
      app.exit(0);
    } catch (e) {
      console.error('Positivkontrolle abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
