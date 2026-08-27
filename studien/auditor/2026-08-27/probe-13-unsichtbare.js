'use strict';
/* ====== Auditor: WARUM sind die 13 unsichtbar? (27.08.2026, 18:10) ======
 *
 * Im Inventar steht als VERMUTUNG, die 13 unsichtbaren Bedienelemente in
 * "Schalter & Einstellungen" haengen an der Schalterstellung der Strategie. Der PM
 * hat zu Recht gesagt: miss es. Und beim Nachsehen im Quelltext faellt schon auf,
 * dass die Vermutung so nicht stimmen kann:
 *
 *   <label class="switch"><input type="checkbox" id="idEnabled"><span class="knob">
 *
 * Das ist ein selbstgebauter Schalter - die Checkbox ist mit Absicht unsichtbar,
 * sichtbar ist der Knopf daneben. Eine unsichtbare Checkbox ist dort KEIN Fund,
 * sondern die Bauweise. Fuer die <select>-Elemente (#idMode, #idExit, #idTrend,
 * #idTrail) gilt das aber NICHT - die muessten sichtbar sein.
 *
 * Diese Probe fragt fuer jedes der 13 einzeln: WARUM nicht sichtbar?
 *   - eigene Groesse null / opacity 0 / clip?         -> Bauweise (Schalter)
 *   - ein Vorfahr display:none oder <details> zu?     -> bedingt eingeblendet
 *   - sonst?                                          -> unklar, benennen
 * Dazu: ist der SICHTBARE Ersatz da (der .knob), und ist das Ganze bedienbar?
 *
 * Aufruf aus der Repo-Wurzel:
 *   .\node_modules\.bin\electron.cmd studien\auditor\2026-08-27\probe-13-unsichtbare.js
 *
 * ACHTUNG: WURZEL geht DREI Ebenen hoch. Nur Reiter/Pillen werden geklickt. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..', '..', '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-auditor-13-'));
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

const IDS = ['idEnabled', 'idExit', 'idMode', 'idKryptoHandeln', 'idTrend', 'idMtf',
  'idChannel', 'idScreener', 'idAutoTune', 'idKrypto', 'idSchattenImmer', 'idTrail',
  'hourlyEnabled', 'pilotOn', 'aoRegime'];

const CODE = "(function (ids) {" +
  "function eigen(el) { var s = getComputedStyle(el); var r = el.getBoundingClientRect();" +
  "  return { anzeige: s.display, sicht: s.visibility, deckkraft: s.opacity," +
  "    br: Math.round(r.width * 10) / 10, ho: Math.round(r.height * 10) / 10," +
  "    position: s.position, clip: s.clipPath && s.clipPath !== 'none' ? s.clipPath : ''," +
  "    ueberlauf: s.overflow }; }" +
  "function grund(el) {" +
  "  var s = getComputedStyle(el), r = el.getBoundingClientRect();" +
  /* 1. Vorfahren zuerst - ein zugeklapptes <details> oder display:none schlaegt alles */
  "  var n = el.parentElement;" +
  "  while (n && n.nodeType === 1) {" +
  "    var ns = getComputedStyle(n);" +
  "    if (n.tagName === 'DETAILS' && !n.open) return { art: 'Vorfahr <details> zugeklappt'," +
  "      wo: (n.id ? '#' + n.id : 'details') + ' \"' + ((n.querySelector('summary')||{}).textContent||'').trim().slice(0,40) + '\"' };" +
  "    if (ns.display === 'none') return { art: 'Vorfahr display:none'," +
  "      wo: n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\\s+/)[0] : '') };" +
  "    if (ns.visibility === 'hidden') return { art: 'Vorfahr visibility:hidden'," +
  "      wo: n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') };" +
  "    if (n === document.body) break;" +
  "    n = n.parentElement; }" +
  /* 2. Sonst an sich selbst */
  "  if (s.display === 'none') return { art: 'selbst display:none', wo: '' };" +
  "  if (s.opacity === '0') return { art: 'selbst opacity:0 (typisch fuer selbstgebaute Schalter)', wo: '' };" +
  "  if (r.width < 1 || r.height < 1) return { art: 'selbst Groesse ~0 (typisch fuer selbstgebaute Schalter)'," +
  "    wo: r.width + 'x' + r.height };" +
  "  return { art: 'unklar - sichtbar nach diesen Massen', wo: '' }; }" +
  "var raus = ids.map(function (id) {" +
  "  var el = document.getElementById(id);" +
  "  if (!el) return { id: id, fehlt: true };" +
  /* Sitzt eine sichtbare Bedienhuelle drumherum? (label.switch mit .knob) */
  "  var huelle = el.closest('label.switch, label, .switch');" +
  "  var knopf = huelle ? huelle.querySelector('.knob, .slider, span') : null;" +
  "  var hs = huelle ? getComputedStyle(huelle) : null;" +
  "  var hr = huelle ? huelle.getBoundingClientRect() : null;" +
  "  var ks = knopf ? getComputedStyle(knopf) : null;" +
  "  var kr = knopf ? knopf.getBoundingClientRect() : null;" +
  "  return { id: id, tag: el.tagName.toLowerCase(), typ: el.getAttribute('type') || ''," +
  "    eigen: eigen(el), grund: grund(el)," +
  "    huelle: huelle ? { klasse: huelle.className || '', anzeige: hs.display," +
  "      br: Math.round(hr.width), ho: Math.round(hr.height) } : null," +
  "    sichtbarerErsatz: knopf ? { klasse: knopf.className || ''," +
  "      br: Math.round(kr.width), ho: Math.round(kr.height)," +
  "      sichtbar: ks.display !== 'none' && kr.width > 0 && kr.height > 0 } : null," +
  "    zustand: el.type === 'checkbox' ? (el.checked ? 'an' : 'aus') : String(el.value).slice(0, 30) }; });" +
  "return raus; })";

async function warte(ms) { return new Promise((r) => setTimeout(r, ms)); }

setTimeout(() => { console.error('13er-Probe: Zeitlimit.'); app.exit(2); }, 400000);

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
      await win.webContents.executeJavaScript(
        "(function(){var b=document.querySelector('nav.tabs [data-tab=\"strategien\"]'); if(b) b.click();" +
        "var p=document.querySelector('#tab-strategien .pills [data-sub=\"strategien\"]'); if(p) p.click(); return 'ok';})()", true);
      await warte(3000);
      const erg = await win.webContents.executeJavaScript(CODE + '(' + JSON.stringify(IDS) + ')', true);
      fs.writeFileSync(path.join(TESTROOT, 'unsichtbare.json'), JSON.stringify(erg, null, 1));
      console.log('BERICHT=' + path.join(TESTROOT, 'unsichtbare.json'));
      erg.forEach((e) => {
        if (e.fehlt) { console.log('  #' + e.id + ': NICHT IM DOM'); return; }
        const ers = e.sichtbarerErsatz;
        console.log('  #' + e.id.padEnd(17) + ' ' + (e.tag + (e.typ ? ':' + e.typ : '')).padEnd(15) +
          ' | ' + e.grund.art + (e.grund.wo ? ' [' + e.grund.wo + ']' : '') +
          ' | sichtbarer Ersatz: ' + (ers ? (ers.sichtbar ? 'JA ' + ers.br + 'x' + ers.ho + ' .' + String(ers.klasse).slice(0, 14) : 'nein') : 'keiner') +
          ' | Zustand: ' + e.zustand);
      });
      app.exit(0);
    } catch (e) {
      console.error('Abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
