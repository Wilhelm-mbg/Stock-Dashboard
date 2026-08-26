'use strict';
/* ================= BARRIEREFREIHEITS-SONDE =================
 *
 * Stufe F (3) des Struktur-Plans nennt vier Punkte: Tabellen-Semantik, aria-live
 * "gezielt statt breit", Fokusreihenfolge in den Dialogen, Kontrast der Chips.
 *
 * DREI DAVON SIND VERMUTUNGEN, keine Befunde - im Plan steht, was jemand beim Lesen
 * fuer wahrscheinlich hielt. Diese Sonde MISST, bevor repariert wird. Sonst repariert
 * man, was nicht kaputt ist, und merkt nicht, was es ist.
 *
 * Sie startet die App vollstaendig isoliert (frisches userData unter %TEMP%, der
 * Speicher des Nutzers wird nie beruehrt), schaltet jeden Reiter und misst dort:
 *
 *   TABELLEN   Hat jede Tabelle eine Kopfzeile? Sitzen die Kopfzellen als <th>?
 *              Ohne <th> liest ein Screenreader eine Zahlenwueste ohne Spaltennamen.
 *   ARIA-LIVE  Wie viele Bereiche melden Aenderungen, und wie GROSS sind sie? Ein
 *              aria-live um einen ganzen Reiter laesst bei jeder Kursaktualisierung
 *              alles vorlesen - das ist lauter, nicht barrierefreier.
 *   FOKUS      Wie viele anspringbare Elemente hat die Seite, und gibt es
 *              tabindex-Werte groesser 0? Positive tabindex-Werte kapern die
 *              Reihenfolge und sind fast immer ein Fehler.
 *   KONTRAST   Verhaeltnis von Text- zu Hintergrundfarbe, gerechnet nach WCAG.
 *              Schwelle 4,5 fuer normalen Text, 3,0 fuer grossen (ab 18,66 px bzw.
 *              14 px fett). Gemessen wird die WIRKLICH gerenderte Farbe, samt
 *              Durchsichtigkeit gegen den tatsaechlichen Hintergrund.
 *
 * Aufruf aus der Repo-Wurzel (ein Fenster erscheint kurz - das ist normal):
 *
 *   .\node_modules\.bin\electron.cmd tools\a11y-probe.js
 *   .\node_modules\.bin\electron.cmd tools\a11y-probe.js --hell
 *
 * Exit 0: keine Befunde. Exit 1: Befunde (stehen im Protokoll). Exit 2: kam nicht durch.
 *
 * Kein Teil von npm test - sie braucht ein Fenster und einige Sekunden.
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..');
const HELL = process.argv.indexOf('--hell') !== -1;
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-a11y-'));
app.setPath('userData', path.join(TESTROOT, 'userdata'));
app.setPath('downloads', path.join(TESTROOT, 'downloads'));
if (HELL) {
  const store = path.join(TESTROOT, 'userdata', 'store');
  fs.mkdirSync(store, { recursive: true });
  fs.writeFileSync(path.join(store, 'theme.json'), JSON.stringify('light'), 'utf8');
}
/* DIE SONDE BRAUCHT INHALT. Erster Lauf am 26.08.2026 meldete "Tabellen 0" und "keine
 * Befunde" - auf einem frischen Profil gibt es weder Positionen noch eigene Papiere
 * noch Protokolle, also wird fast nichts gezeichnet. Eine gruene Pruefung ohne Inhalt
 * beweist gar nichts; sie sagt nur, dass sie nichts zu sehen bekommen hat.
 * Deshalb: ein Depot mit Positionen, ein paar eigene Papiere und drei echte Protokolle
 * aus dem Repo. Alles im Wegwerf-Profil - der Bestand des Nutzers wird nie beruehrt. */
function saeen() {
  var store = path.join(TESTROOT, 'userdata', 'store');
  fs.mkdirSync(store, { recursive: true });
  var jetzt = Date.now();
  var hist = [];
  for (var h = 0; h < 40; h++) hist.push([jetzt - (40 - h) * 86400000, 10000 + h * 37 - (h % 7) * 90]);
  fs.writeFileSync(path.join(store, 'depot.json'), JSON.stringify({
    cash: 7400, equityHist: hist,
    positions: [{ sym: 'AAPL', name: 'Apple', stueck: 4, einstand: 300.5, auf: jetzt - 3 * 86400000, modus: 'rsi2seit' },
                { sym: 'MSFT', name: 'Microsoft', stueck: 2, einstand: 480.1, auf: jetzt - 86400000, modus: 'kapitulation' }],
    trades: [], weights: { news: 0.2, tech: 0.5, elliott: 0.3 },
    intraday: { enabled: false, mode: 'rsi2seit', interval: '60m' } }));
  fs.writeFileSync(path.join(store, 'bestand.json'), JSON.stringify({ stand: jetzt, werte: [
    { sym: 'AAPL', name: 'Apple Inc.', stueck: 12, isin: 'US0378331005' },
    { sym: 'KO', name: 'Coca-Cola', stueck: 60, isin: 'US1912161007' },
    { sym: 'XOM', name: 'Exxon Mobil', stueck: 8, isin: 'US30231G1022' } ] }));
  /* Protokolle: die App liest sie zur Laufzeit aus dem Datenordner. */
  var pQuelle = path.join(WURZEL, 'studien', 'messmaschine', 'protokolle');
  var pZiel = path.join(TESTROOT, 'downloads', 'Markt-Dashboard-Daten', 'protokolle');
  try {
    fs.mkdirSync(pZiel, { recursive: true });
    fs.readdirSync(pQuelle).filter(function (f) { return f.indexOf('2026-08-26') !== -1; })
      .slice(0, 4).forEach(function (f) { fs.copyFileSync(path.join(pQuelle, f), path.join(pZiel, f)); });
  } catch (e) { console.error('(Protokolle nicht kopierbar: ' + (e && e.message) + ')'); }
}
saeen();

app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
const origLoadFile = BrowserWindow.prototype.loadFile;
BrowserWindow.prototype.loadFile = function (fp, opts) {
  if (!path.isAbsolute(fp)) fp = path.join(WURZEL, fp);
  return origLoadFile.call(this, fp, opts);
};

/* Der Messcode laeuft IN der Seite. Er steht als Zeichenkette hier, damit die Sonde
 * ohne Aufbauschritt auskommt - dieselbe Bauart wie ui-probe.js. */
const MESSCODE = `(function () {
  function rgb(s) {
    var m = String(s).match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    var t = m[1].split(',').map(function (x) { return parseFloat(x); });
    return { r: t[0], g: t[1], b: t[2], a: t.length > 3 ? t[3] : 1 };
  }
  /* Der tatsaechliche Hintergrund: nach oben laufen, bis eine deckende Farbe kommt.
   * Ein durchsichtiges Element hat sonst "rgba(0,0,0,0)" und jede Rechnung darauf
   * waere erfunden. */
  function grund(el) {
    var n = el;
    while (n && n.nodeType === 1) {
      var c = rgb(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.95) return c;
      n = n.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  }
  function mischen(vorn, hinten) {
    if (!vorn) return hinten;
    var a = vorn.a == null ? 1 : vorn.a;
    return { r: vorn.r * a + hinten.r * (1 - a),
             g: vorn.g * a + hinten.g * (1 - a),
             b: vorn.b * a + hinten.b * (1 - a), a: 1 };
  }
  function leucht(c) {
    function k(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * k(c.r) + 0.7152 * k(c.g) + 0.0722 * k(c.b);
  }
  function verhaeltnis(a, b) {
    var l1 = leucht(a), l2 = leucht(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function sichtbar(el) {
    var r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    var st = getComputedStyle(el);
    return st.display !== 'none' && st.visibility !== 'hidden' && parseFloat(st.opacity || '1') > 0.05;
  }

  var reiter = document.querySelector('nav.tabs button[data-tab].active');
  var name = reiter ? reiter.getAttribute('data-tab') : '?';
  var panel = document.querySelector('.tab.active') || document.body;

  /* ---- Tabellen ---- */
  var tabellen = [], ohneKopf = [];
  Array.prototype.forEach.call(panel.querySelectorAll('table'), function (t) {
    if (!sichtbar(t)) return;
    tabellen.push(1);
    var th = t.querySelectorAll('th').length;
    if (!th) {
      var erste = t.querySelector('tr');
      ohneKopf.push({ zellen: erste ? erste.children.length : 0,
                      text: (t.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 50) });
    }
  });

  /* ---- aria-live ---- */
  var live = [];
  Array.prototype.forEach.call(document.querySelectorAll('[aria-live]'), function (el) {
    if (!sichtbar(el)) return;
    var r = el.getBoundingClientRect();
    live.push({ id: el.id || el.className || el.tagName,
                wert: el.getAttribute('aria-live'),
                flaeche: Math.round(r.width * r.height),
                kinder: el.querySelectorAll('*').length,
                zeichen: (el.textContent || '').trim().length });
  });

  /* ---- Fokus ---- */
  var fokus = document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]');
  var positiv = [];
  Array.prototype.forEach.call(fokus, function (el) {
    var t = parseInt(el.getAttribute('tabindex'), 10);
    if (t > 0) positiv.push((el.id || el.tagName) + ' tabindex=' + t);
  });
  /* Anspringbar, aber ohne jeden zugaenglichen Namen - ein Knopf, den der
   * Screenreader nur "Schaltflaeche" nennen kann. */
  var namenlos = [];
  Array.prototype.forEach.call(fokus, function (el) {
    if (!sichtbar(el)) return;
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') return;
    var txt = (el.textContent || '').trim();
    var nam = el.getAttribute('aria-label') || el.getAttribute('title') || txt;
    if (!nam) namenlos.push(el.id || (el.className && String(el.className).slice(0, 30)) || el.tagName);
  });

  /* ---- Kontrast ---- */
  var schwach = [], geprueft = 0;
  Array.prototype.forEach.call(panel.querySelectorAll('*'), function (el) {
    if (!sichtbar(el)) return;
    var eigen = Array.prototype.filter.call(el.childNodes, function (n) {
      return n.nodeType === 3 && n.textContent.trim().length > 0;
    });
    if (!eigen.length) return;
    var st = getComputedStyle(el);
    var v = mischen(rgb(st.color), grund(el));
    var h = grund(el);
    var r = verhaeltnis(v, h);
    geprueft++;
    var px = parseFloat(st.fontSize) || 16;
    var fett = (parseInt(st.fontWeight, 10) || 400) >= 700;
    var gross = px >= 18.66 || (fett && px >= 14);
    var soll = gross ? 3 : 4.5;
    if (r < soll) {
      /* Die WIRKLICH gerenderten Farben mitschreiben - sonst raet man hinterher,
       * welche Farbmarke schuld ist, und repariert die Stelle statt der Ursache. */
      function hx(c) { return "#" + [c.r, c.g, c.b].map(function (x) { return ("0" + Math.round(x).toString(16)).slice(-2); }).join(""); }
      schwach.push({ vorn: hx(v), hinten: hx(h),
                     text: eigen.map(function (n) { return n.textContent.trim(); }).join(' ').slice(0, 40),
                     wo: el.id || (el.className && String(el.className).slice(0, 24)) || el.tagName,
                     verhaeltnis: Math.round(r * 100) / 100, soll: soll, px: Math.round(px), fett: fett });
    }
  });

  return JSON.stringify({ reiter: name, tabellen: tabellen.length, ohneKopf: ohneKopf,
    live: live, positiveTabindex: positiv, namenlos: namenlos,
    kontrastGeprueft: geprueft, kontrastSchwach: schwach });
})()`;

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  win.webContents.once('did-finish-load', async () => {
    try {
      win.setContentSize(1280, 800);
      const wc = win.webContents;
      const js = (c) => wc.executeJavaScript(c, true);
      await new Promise((r) => setTimeout(r, 6000));
      const tabs = await js("Array.prototype.map.call(document.querySelectorAll('nav.tabs button[data-tab]'), function (b) { return b.getAttribute('data-tab'); })");
      const alles = [];
      /* Jede Pille eigens: die interessanten Tabellen liegen hinter Unterseiten
       * (Meine Papiere, Buecher, Protokoll). Wer nur die Reiter schaltet, misst die
       * Haelfte der Oberflaeche nicht. */
      for (const t of tabs) {
        await js("document.querySelector('nav.tabs button[data-tab=\"" + t + "\"]').click(); 'ok'");
        await new Promise((r) => setTimeout(r, 900));
        alles.push(JSON.parse(await js(MESSCODE)));
        const pillen = await js("Array.prototype.map.call((document.querySelector('.tab.active') || document).querySelectorAll('.pills button[data-sub]'), function (b) { return b.getAttribute('data-sub'); })");
        for (const p of pillen) {
          await js("(function(){var b=(document.querySelector('.tab.active')||document).querySelector('.pills button[data-sub=\"" + p + "\"]'); if(b) b.click(); return 'ok';})()");
          await new Promise((r) => setTimeout(r, 700));
          const m = JSON.parse(await js(MESSCODE));
          m.reiter = t + " / " + p;
          alles.push(m);
        }
      }
      console.log('Barrierefreiheits-Sonde, Thema ' + (HELL ? 'HELL' : 'DUNKEL') + ', 1280x800\n');
      let befunde = 0;
      alles.forEach((a) => {
        console.log('== ' + a.reiter + ' ==');
        console.log('   Tabellen ' + a.tabellen + ', davon ohne Kopfzeile: ' + a.ohneKopf.length);
        a.ohneKopf.forEach((t) => { befunde++; console.log('      OHNE <th>: ' + t.zellen + ' Spalten - "' + t.text + '"'); });
        console.log('   aria-live-Bereiche: ' + a.live.length);
        a.live.forEach((l) => {
          const gross = l.flaeche > 200000 || l.kinder > 40;
          if (gross) befunde++;
          console.log('      ' + (gross ? 'ZU BREIT: ' : '') + l.id + ' [' + l.wert + '] ' +
            l.flaeche + ' px2, ' + l.kinder + ' Kinder, ' + l.zeichen + ' Zeichen');
        });
        if (a.positiveTabindex.length) { befunde += a.positiveTabindex.length; console.log('   POSITIVE tabindex: ' + a.positiveTabindex.join(', ')); }
        if (a.namenlos.length) { befunde += a.namenlos.length; console.log('   OHNE NAMEN anspringbar: ' + a.namenlos.slice(0, 6).join(', ') + (a.namenlos.length > 6 ? ' (+' + (a.namenlos.length - 6) + ')' : '')); }
        console.log('   Kontrast: ' + a.kontrastGeprueft + ' Textstellen geprueft, ' + a.kontrastSchwach.length + ' unter der Schwelle');
        a.kontrastSchwach.slice(0, 8).forEach((k) => {
          befunde++;
          console.log('      ' + k.verhaeltnis + ' : 1  (soll ' + k.soll + ')  ' + k.px + 'px' + (k.fett ? ' fett' : '') +
            '  ' + k.vorn + ' auf ' + k.hinten + '  ' + k.wo + '  "' + k.text + '"');
        });
        if (a.kontrastSchwach.length > 8) { befunde += a.kontrastSchwach.length - 8; console.log('      (+' + (a.kontrastSchwach.length - 8) + ' weitere)'); }
        console.log('');
      });
      console.log(befunde ? 'SONDE ROT: ' + befunde + ' Befund(e).' : 'SONDE GRUEN: keine Befunde.');
      app.exit(befunde ? 1 : 0);
    } catch (e) {
      console.error('Sonde abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});
setTimeout(() => { console.error('Sonde: Zeitlimit.'); app.exit(2); }, 180000);
require(path.join(WURZEL, 'main.js'));
