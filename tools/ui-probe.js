'use strict';
/* ================= UI-Probe: der kleinste Verhaltenstest der Oberflaeche =================
 *
 * Struktur-Audit Punkt 12 (25.08.2026): test-v6 prueft Quelltext per Textmarke und
 * kann deshalb eine ganze Fehlerklasse nicht sehen - eine Pille ohne Wirkung, ein
 * Reiter, der beim Schalten wirft. Genau diese Klasse hat die App schon getroffen
 * (die Pillen aller Reiter waren tot, bis depot.js init() durch war).
 *
 * Diese Probe startet die App VOLLSTAENDIG ISOLIERT (frisches userData und ein
 * frischer Datenordner unter %TEMP% - Store, Depot und Downloads des Nutzers werden
 * nie beruehrt), klickt jeden Reiter und jede Pille und zaehlt unbehandelte Fehler.
 *
 * Aufruf aus der Repo-Wurzel (ein Fenster erscheint kurz - das ist normal):
 *
 *   .\node_modules\.bin\electron.cmd tools\ui-probe.js
 *   .\node_modules\.bin\electron.cmd tools\ui-probe.js --leer
 *
 * Seit dem 04.09.2026 laeuft die Probe MIT Kunstdaten (--leer stellt die alte,
 * leere Instanz her) und misst zusaetzlich bei 1024 UND 1280 px, ob ein Panel
 * breiter ist als das Fenster. Das ist die Sperrklinke gegen QS-Fund F1.
 *
 * Und sie WANDERT mit echten Tab-Tasten durch den Reiter Markt und den
 * Maschinenraum und prueft, dass jedes fokussierte Element im Fenster liegt
 * (QS-Funde F6/F7). Offene Funde stehen in BEKANNTE_ABWEICHUNGEN und zaehlen nicht
 * in den Exit-Code - alles andere schon.
 *
 * Exit-Code 0: jeder Reiter und jede Pille schaltet ihr Panel aktiv, keine
 * unbehandelten Fehler. Exit-Code 1: mindestens ein Befund (steht im Protokoll).
 * Exit-Code 2: die Probe selbst kam nicht durch (Zeitlimit, Startfehler).
 *
 * Kein Teil von npm test: die Probe braucht ein Fenster und einige Sekunden echten
 * App-Start. Sie gehoert VOR jeden Umbau der Navigation oder der Reiterinhalte -
 * einmal vorher gruen, einmal nachher gruen. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-ui-probe-'));
app.setPath('userData', path.join(TESTROOT, 'userdata'));
app.setPath('downloads', path.join(TESTROOT, 'downloads'));
/* Ohne diese Schalter pausiert Chromium verdeckte Fenster - die Probe soll aber
 * auch laufen, wenn ihr Fenster hinter anderen liegt. */
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

/* loadFile loest relative Pfade gegen app.getAppPath() auf, und das ist bei diesem
 * Einstiegspunkt tools/ - der Patch biegt sie auf die Repo-Wurzel. */
const origLoadFile = BrowserWindow.prototype.loadFile;
BrowserWindow.prototype.loadFile = function (fp, opts) {
  if (!path.isAbsolute(fp)) fp = path.join(WURZEL, fp);
  return origLoadFile.call(this, fp, opts);
};

/* Kunstdaten: seit dem 04.09.2026 die VORGABE. Die Bildlauf-Pruefung weiter unten
 * haengt an ihnen - der Fund, den sie festhaelt (QS F1), war nur mit offener
 * Intraday-Position zu sehen, ein leeres Depot zeigt ihn nicht. --leer stellt den
 * alten Lauf her; die beiden Laeufe sind GEGENUEBERZUSTELLEN, nicht zu ersetzen:
 * die leere Instanz ist ein echter Zustand der App (und die Gegenprobe zur
 * Zusicherung ueber den Intraday-Bereich, die genau dann greift, wenn die
 * Strategie AUS ist). Gesaet wird mit demselben Modul wie in ui-aufnahmen.js -
 * zwei Abschriften wuerden driften. */
const KUNSTDATEN = process.argv.indexOf('--leer') === -1;
if (KUNSTDATEN) require(path.join(__dirname, 'kunstinstanz.js')).saeen(TESTROOT);

const konsoleFehler = [];

/* ================= BEKANNTE ABWEICHUNGEN MIT FUNDSTELLE =================
 *
 * Eine Sonde, die einen noch offenen Fund misst, hat drei Moeglichkeiten, und zwei
 * davon sind falsch: dauerhaft rot bleiben (dann schaut nach einer Woche niemand
 * mehr hin, weil sie ja immer rot ist) oder die Messung auskommentieren (dann faellt
 * mit dem Rot auch die Messung weg, und die Rueckkehr des Fundes merkt keiner).
 *
 * Der dritte Weg: der Fund steht hier, MIT seiner Fundstelle. Die Sonde misst ihn
 * weiter, weist ihn als BEKANNT ROT samt Quelle aus und laesst ihn nicht in den
 * Exit-Code einfliessen. Alles, was NICHT hier steht, ist rot. Ein Eintrag ohne
 * Fundstelle waere ein stiller Deckel - deshalb traegt jeder eine.
 *
 * sporadisch: der Fund tritt nicht bei jedem Lauf auf (F7 haengt am Minutentakt und
 * ist 1 von 1 Durchlauf belegt). Bei allen anderen meldet die Sonde es, wenn ein
 * Eintrag NICHT mehr auftritt - dann ist er behoben und der Eintrag gehoert
 * gestrichen. Behoben zu sein macht die Sonde NICHT rot: eine Reparatur darf keine
 * Pruefung umwerfen, sie soll nur nicht unbemerkt bleiben. */
/* LEER seit Oberflaeche Stufe 6 (04.09.2026): F6 und F7 standen hier und sind
 * behoben. F6 - das Laufband zeigt seither nur die Meldungen, die im Kasten NICHT
 * stehen, und schiebt den Fokus ins Bild. F7 - hotlistsZeichnen merkt sich das
 * Kuerzel der fokussierten Zeile und setzt den Fokus danach zurueck. Beide werden
 * weiter gemessen (Fokus-Wanderung oben, viewerPruefen unten), jetzt aber OHNE
 * Deckel: ein Rueckfall ist ab sofort rot. Die Liste bleibt stehen, weil der
 * naechste offene Fund wieder hier hineingehoert - mit Fundstelle. */
const BEKANNTE_ABWEICHUNGEN = [];
function bekannteAbweichung(reiter, ort) {
  return BEKANNTE_ABWEICHUNGEN.filter(function (a) {
    return (a.reiter === '*' || a.reiter === reiter) && a.ort === ort;
  })[0] || null;
}

/* ---- Passt der Rumpf ins Fenster? (Rumpf bei 1024, 04.09.2026) ----
 *
 * Das ist die Sperrklinke gegen die Rueckkehr von QS-Fund F1: bei 1024 px hatte
 * "Heute -> Ueberblick" eine waagerechte Bildlaufleiste (scrollWidth 1040 bei
 * clientWidth 1014), weil die Tabelle "Offene Positionen" mit ihren vierzehn
 * Spalten 1005 px breit war - der Knopf "Schliessen" endete bei x = 1032 und war
 * ohne seitliches Scrollen nicht erreichbar.
 *
 * Warum eine Sonde und kein Textmarken-Test: die Breite einer Tabelle steht
 * nirgends im Quelltext. Sie entsteht erst aus Schrift, Zahlenlaenge und Daten -
 * nur ein laufendes Fenster kann sie messen. Und nur MIT Kunstdaten: ein leeres
 * Depot zeigt gar keine Tabelle, die Sonde waere blind und gruen.
 *
 * Gemessen wird die EIGENSCHAFT, nicht das Aussehen: scrollWidth des Dokuments
 * gegen seine clientWidth. Sind sie gleich, gibt es keine waagerechte
 * Bildlaufleiste. Ein Kasten, der SELBST scrollt (overflow-x: auto), ist
 * ausdruecklich in Ordnung - er verbreitert das Dokument nicht; die Frage lautet
 * "scrollt die SEITE", nicht "scrollt hier irgendwo etwas".
 *
 * Beide Breiten, weil beide zugesichert sind: 1280 ist die Vorgabe, 1024 die
 * kleinste Breite, fuer die die Oberflaeche geradesteht. Stufe 4 hatte fuer 1024
 * nur die KOPFZEILE gemessen - genau durch diese Luecke kam F1. */
const BREITEN = [1024, 1280];
const HOEHE = 820;

async function bildlaufPruefen(win, js, breite) {
  win.setContentSize(breite, HOEHE);
  await new Promise((r) => setTimeout(r, 900));
  const funde = [];
  let flaechen = 0;
  const tabs = await js("Array.prototype.map.call(document.querySelectorAll('nav.tabs button[data-tab]'), function (b) { return b.getAttribute('data-tab'); })");
  for (const tab of (tabs || [])) {
    await js("(function () { var b = document.querySelector('nav.tabs [data-tab=\"" + tab + "\"]'); if (b) b.click(); return 'ok'; })()");
    await new Promise((r) => setTimeout(r, 300));
    const subs = await js("Array.prototype.map.call(document.querySelectorAll('#tab-" + tab + " .pills button[data-sub]'), function (b) { return b.getAttribute('data-sub'); })");
    const liste = (subs && subs.length) ? subs : [null];
    for (const sub of liste) {
      if (sub) {
        await js("(function () { var b = document.querySelector('#tab-" + tab + " .pills [data-sub=\"" + sub + "\"]'); if (b) b.click(); return 'ok'; })()");
        await new Promise((r) => setTimeout(r, 300));
      }
      flaechen++;
      const sel = sub ? '#sub-' + sub : '#tab-' + tab;
      /* Der Ort dazu: das Element, dessen rechte Kante am weitesten hinausragt.
       * Eine Zahl ohne Ort waere ein Alarm, dem niemand nachgehen kann. */
      const m = await js("(function () {" +
        "var de = document.documentElement, cw = de.clientWidth, sw = de.scrollWidth;" +
        "var ort = '', rechts = 0;" +
        "if (sw > cw) {" +
          "var wurzel = document.querySelector('" + sel + "') || document.body;" +
          "var alle = wurzel.querySelectorAll('*');" +
          "for (var i = 0; i < alle.length; i++) {" +
            "var e = alle[i]; if (!e.offsetParent && e.tagName !== 'TABLE') continue;" +
            "var r = e.getBoundingClientRect();" +
            "if (r.width === 0 && r.height === 0) continue;" +
            "if (Math.round(r.right) <= rechts || Math.round(r.right) <= cw) continue;" +
            "rechts = Math.round(r.right);" +
            "ort = e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') +" +
              "(e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '');" +
          "} }" +
        "return { s: sw, c: cw, ort: ort, rechts: rechts }; })()");
      if (m.s > m.c) {
        funde.push({ seite: sub ? tab + '/' + sub : tab, scrollWidth: m.s, clientWidth: m.c,
                     ueber: m.s - m.c, ort: m.ort, rechts: m.rechts });
      }
    }
  }
  return { flaechen: flaechen, funde: funde };
}

/* ---- FOKUS: mit echten Tab-Tasten wandern (QS-Funde F6/F7, 04.09.2026) ----
 *
 * Gedrueckt wird die Taste, nicht focus() gerufen. Der Unterschied ist kein
 * Feinschliff: die QS hat sich hier zuerst geirrt und aus dem DOM ueber
 * offsetParent 78 anspringbare Elemente im Maschinenraum geschlossen. Es sind
 * zwoelf - Chromium laesst Kinder geschlossener <details> ein Layout-Kaestchen
 * behalten. Erst das Tastendruecken hat es geklaert.
 *
 * Gefragt wird nach jedem Schritt, WO das fokussierte Element liegt. Ein Fokus
 * ausserhalb des Fensters ist einer, den der Nutzer nicht sieht - er weiss dann
 * nicht, wo er ist, und die Tastaturbedienung endet an dieser Stelle. */
const FOKUSCODE = "(function () {" +
  /* Der zweite Weg, einen Fokus unsichtbar zu machen - und der, den F6 wirklich
   * nimmt: das Element liegt ausserhalb eines beschnittenen Kastens, und Chromium
   * VERSCHIEBT den Kasten, damit es sichtbar wird. Danach steht es im Fenster, die
   * Pruefung "liegt es drin" ist gruen - und der Nutzer sieht trotzdem ein Band,
   * das ohne sein Zutun weggerutscht ist und das er nicht zurueckschieben kann,
   * weil overflow: hidden keine Bildlaufleiste hat. Laeuft dazu noch eine
   * Animation, schiebt die es sofort zurueck und der Fokus ist wieder weg.
   * Gemessen wird deshalb die Verschiebung selbst. */
  "function geschoben(el) {" +
    "var n = el.parentElement;" +
    "while (n && n !== document.body) {" +
      "var st = getComputedStyle(n);" +
      "var kl = (st.overflowX === 'hidden' || st.overflowX === 'clip' ||" +
                "st.overflowY === 'hidden' || st.overflowY === 'clip');" +
      "if (kl && (n.scrollLeft > 1 || n.scrollTop > 1)) return (n.id || n.tagName) +" +
        "' um ' + Math.round(n.scrollLeft) + '/' + Math.round(n.scrollTop) + ' px';" +
      "n = n.parentElement;" +
    "} return ''; }" +
  "var e = document.activeElement; if (!e) return null;" +
  "var r = e.getBoundingClientRect();" +
  "var n = e, ort = e.tagName;" +
  "while (n && n !== document.body) { if (n.id) { ort = n.id; break; } n = n.parentElement; }" +
  "return { ort: ort, tag: e.tagName," +
    "text: (e.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 40)," +
    "links: Math.round(r.left), oben: Math.round(r.top)," +
    "rechts: Math.round(r.right), unten: Math.round(r.bottom)," +
    "geschoben: geschoben(e)," +
    "breit: window.innerWidth, hoch: window.innerHeight }; })()";

/* Dialoge wegklicken, bevor gewandert wird. Ein offener Modaldialog haelt den Fokus
 * fest - richtig so, aber dann wandert die Tab-Taste in ihm und nicht durch die
 * Oberflaeche. Die Reihenfolge ist NICHT beliebig: erststart.js oeffnet sein Fenster
 * erst, wenn der Diagnose-Dialog zu ist, und pollt dafuer im Sekundentakt (siehe
 * tools/ui-aufnahmen.js). Also klicken, dann warten, bis keiner mehr offen ist.
 * Geklickt wird nur "Nein, nichts senden" und "Schliessen" - kein Knopf der
 * Sperrliste (wiki/betrieb.md). */
async function dialogeSchliessen(js) {
  await js("(function () { var b = document.getElementById('diagNein'); if (b) b.click(); return 'ok'; })()");
  /* VIER leere Blicke hintereinander, nicht einer. Der erste Versuch brach beim
   * ersten leeren Blick ab - und erststart.js macht sein Fenster erst eine Sekunde
   * spaeter auf, also genau in die Luecke hinein. Die Wanderung lief danach im
   * Erststart-Kasten und meldete "0 draussen". */
  var leer = 0;
  for (var i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const offen = await js("(function () {" +
      "var o = document.querySelector('.modal-bg.open'); if (!o) return '';" +
      "var k = o.querySelector('#erststartOk, #diagNein, [data-close=\"' + o.id + '\"]');" +
      "if (k) k.click(); return o.id; })()");
    leer = offen ? 0 : leer + 1;
    if (leer >= 4) return true;
  }
  return false;
}

async function tabWanderung(win, js, tab, sub, schritte) {
  await js("(function () { var b = document.querySelector('nav.tabs [data-tab=\"" + tab + "\"]'); if (b) b.click(); return 'ok'; })()");
  await new Promise((r) => setTimeout(r, 700));
  if (sub) {
    await js("(function () { var b = document.querySelector('#tab-" + tab + " .pills [data-sub=\"" + sub + "\"]'); if (b) b.click(); return 'ok'; })()");
    await new Promise((r) => setTimeout(r, 700));
  }
  /* Startpunkt ist der Reiterknopf - von dort wandert Tab in die Seite hinein.
   * Ohne Fenster- und Renderer-Fokus kaeme die Taste gar nicht an; sendInputEvent
   * liefe dann ins Leere und die Wanderung bliebe still auf Schritt eins stehen. */
  await js("(function () { var b = document.querySelector('nav.tabs [data-tab=\"" + tab + "\"]'); if (b) b.focus(); return 'ok'; })()");
  win.focus();
  win.webContents.focus();
  await new Promise((r) => setTimeout(r, 300));
  const weg = [];
  for (let i = 0; i < schritte; i++) {
    win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Tab' });
    win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Tab' });
    await new Promise((r) => setTimeout(r, 120));
    const a = await js(FOKUSCODE);
    if (!a) continue;
    /* Ganz oder teilweise draussen - beides ist ein Fokus, den man nicht sieht.
     * Ein Pixel Rand, damit Rundung keinen Fund erfindet. */
    a.ausserhalb = a.rechts > a.breit + 1 || a.links < -1 || a.unten > a.hoch + 1 || a.oben < -1;
    a.draussen = a.ausserhalb || !!a.geschoben;
    a.schritt = i + 1;
    weg.push(a);
  }
  return weg;
}

/* Die Wanderung auswerten: was in BEKANNTE_ABWEICHUNGEN steht, wird als bekannt rot
 * ausgewiesen und zaehlt nicht in den Exit-Code; alles andere ist ein Befund. */
function fokusAuswerten(reiter, weg, probleme, bekannteRot, gesehen) {
  weg.filter(function (a) { return a.draussen; }).forEach(function (a) {
    const b = bekannteAbweichung(reiter, a.ort);
    const wo = reiter + ' Schritt ' + a.schritt + ': Fokus auf ' + a.ort + ' (' + a.tag + ') ' +
      (a.ausserhalb ? 'liegt ausserhalb des Fensters' : 'wurde nur sichtbar, weil ' + a.geschoben +
        ' verschoben wurde - ein Kasten ohne Bildlaufleiste') +
      ' - x ' + a.links + '…' + a.rechts + ', y ' + a.oben + '…' + a.unten +
      ' bei ' + a.breit + 'x' + a.hoch + (a.text ? ' „' + a.text + '"' : '');
    if (b) {
      gesehen[b.fund] = true;
      if (bekannteRot.every(function (z) { return z.indexOf(b.fund + ' ') !== 0; })) {
        bekannteRot.push(b.fund + ' (' + b.quelle + '): ' + wo + ' — ' + b.was);
      }
    } else {
      probleme.push('Fokus: ' + wo);
    }
  });
}

/* ---- Der Aktien-Viewer, F2 und F7 am laufenden Fenster (Stufe 6, 04.09.2026) ----
 *
 * Drei Dinge lassen sich nur hier messen, nicht als Textmarke:
 *   VIEWER  zeichnet der Kerzenchart ueberhaupt? Mit Kunstdaten und OHNE Netz - die
 *           Kerzen kommen aus dem Kunst-Archiv im Temp-Datenordner ueber dieselbe
 *           Leseauskunft wie im Betrieb.
 *   F2      stehen an den DREI Orten des Sitzungszustands dieselben Worte? Der Fund
 *           war ja gerade, dass beide Seiten fuer sich richtig waren.
 *   F7      ueberlebt der Fokus ein Neuschreiben der Hotlists? Der Fund haengt am
 *           Minutentakt; ausgeloest wird er hier von Hand ueber sub-changed, damit
 *           die Probe nicht eine Minute wartet und dabei doch nichts belegt.
 */
async function viewerPruefen(win, js) {
  const funde = [];
  await js("(function () { var b = document.querySelector('nav.tabs [data-tab=\"werkzeuge\"]'); if (b) b.click(); " +
           "var p = document.querySelector('#wzPills [data-sub=\"explorer\"]'); if (p) p.click(); return 'ok'; })()");
  await new Promise((r) => setTimeout(r, 400));
  /* Geoeffnet wird ueber DIESELBE Schnittstelle, die Hotlists und Marktkarte
   * benutzen - eine eigene waere ein zweiter Weg in denselben Bildschirm. */
  const sym = await js("(function () { var K = window.KunstProbe; return 'KUNSTA'; })()");
  await js("(function () { window.Explorer.oeffne('" + sym + "', 'Kunst A'); return 'ok'; })()");
  await new Promise((r) => setTimeout(r, 3500));

  const z = await js("(function () {" +
    " var zr = document.querySelectorAll('#vwZeitraum button[data-zeitraum]');" +
    " var kn = document.querySelectorAll('#vwKerze button[data-kerze]');" +
    " var c = document.getElementById('vwChart');" +
    " var V = window.__viewer || {};" +
    " return { zeitraeume: Array.prototype.map.call(zr, function (b) { return b.getAttribute('data-zeitraum'); })," +
    "   kerzen: Array.prototype.map.call(kn, function (b) { return b.getAttribute('data-kerze'); })," +
    "   gesperrt: Array.prototype.filter.call(kn, function (b) { return b.disabled; })" +
    "     .map(function (b) { return b.getAttribute('data-kerze') + (b.getAttribute('title') ? '' : ' OHNE-GRUND'); })," +
    "   zoomKnoepfe: document.querySelectorAll('#vwZoom button[data-zoom]').length," +
    "   schalter: document.querySelectorAll('#vwEinblenden input[data-sig]').length," +
    "   indi: document.querySelectorAll('#vwEinblenden input[data-ind]').length," +
    "   aktivZ: (document.querySelector('#vwZeitraum button.active') || {}).textContent || ''," +
    "   aktivK: (document.querySelector('#vwKerze button.active') || {}).textContent || ''," +
    "   quelle: (document.getElementById('vwQuelle') || {}).textContent || ''," +
    "   detailVerborgen: !!(document.getElementById('vwQuelleDetail') || {}).hidden," +
    "   kopf: (document.getElementById('vwKopf') || {}).textContent || ''," +
    "   belegstand: (document.getElementById('vwBelegstand') || {}).textContent || ''," +
    "   canvasBreite: c ? c.width : 0, canvasHoehe: c ? c.height : 0," +
    "   fest: (V.fest || []).length, sichtbar: V.sichtbar ? V.sichtbar.kerzen.length : 0," +
    "   nurRegulaer: !!V.nurRegulaer }; })()");
  console.log('    Viewer: ' + z.zeitraeume.length + ' Zeitraeume (' + z.zeitraeume.join(' ') + '), ' +
    z.kerzen.length + ' Kerzenlaengen (' + z.kerzen.join(' ') + '), aktiv ' + z.aktivZ + '/' + z.aktivK);
  console.log('    Gesperrt bei ' + z.aktivZ + ': ' + (z.gesperrt.join(' ') || 'nichts') +
    ' · ' + z.schalter + ' Signal-, ' + z.indi + ' Chartbild-Schalter · ' + z.zoomKnoepfe + ' Zoom-Knoepfe');
  console.log('    ' + z.fest + ' Kerzen geladen, ' + z.sichtbar + ' im Bild, Canvas ' + z.canvasBreite + 'x' + z.canvasHoehe);
  console.log('    Fusszeile: ' + String(z.quelle).slice(0, 160));
  if (z.zeitraeume.length !== 8) funde.push('Viewer: ' + z.zeitraeume.length + ' Zeitraum-Knoepfe statt acht');
  if (z.kerzen.length !== 7) funde.push('Viewer: ' + z.kerzen.length + ' Kerzen-Knoepfe statt sieben');
  if (z.gesperrt.some(function (g) { return /OHNE-GRUND/.test(g); })) {
    funde.push('Viewer: ein gesperrter Kerzen-Knopf traegt keinen Grund: ' + z.gesperrt.join(' '));
  }
  if (z.zoomKnoepfe !== 3) funde.push('Viewer: ' + z.zoomKnoepfe + ' Zoom-Knoepfe statt drei (+ − ↺)');
  if (!z.schalter || !z.indi) funde.push('Viewer: die Leiste "Einblenden" ist leer (' + z.schalter + ' Signale, ' + z.indi + ' Chartbild)');
  if (!z.detailVerborgen) funde.push('Viewer: die Einzelheiten der Fusszeile stehen offen, statt hinter dem i-Knopf zu liegen');
  if (!z.canvasBreite) funde.push('Viewer: die Zeichenflaeche hat keine Breite - es wurde nichts gezeichnet');
  if (!z.fest) funde.push('Viewer: keine Kerze geladen, obwohl das Kunst-Archiv eine Reihe fuer ' + sym + ' fuehrt');
  if (!String(z.quelle).trim()) funde.push('Viewer: die Fusszeile ist stumm - sie muss immer sagen, woher die Kerzen kommen');
  if (String(z.quelle).indexOf('Archiv') === -1 && String(z.quelle).indexOf('Alpaca') === -1) {
    funde.push('Viewer: die Fusszeile nennt das Archiv nicht: ' + String(z.quelle).slice(0, 80));
  }
  /* Die Fusszeile ist EIN Satz - der Auftrag 8a hat sie aus einer Textwand geholt. */
  if (String(z.quelle).split('·').length > 6) {
    funde.push('Viewer: die Fusszeile hat wieder ' + String(z.quelle).split('·').length + ' Abschnitte - sie soll ein Satz sein');
  }
  if (!String(z.belegstand).trim()) funde.push('Viewer: der Wegweiser zum Belegstand fehlt');

  /* ---- Zeitraum-Klick: setzt er die Kerze vor? ----
   * 5J muss auf Wochenkerzen umstellen, 1M auf Stundenkerzen. Zwei verschiedene
   * Ziele: eine Klinke, die nur EINEN Wert prueft, koennte auch eine Konstante sein. */
  async function zeitraumKlick(wohin) {
    const t0 = Date.now();
    await js("(function () { var b = document.querySelector('#vwZeitraum [data-zeitraum=\"" + wohin + "\"]'); if (b) b.click(); return 'ok'; })()");
    /* Gewartet wird auf das ERGEBNIS, nicht auf eine feste Zeit: sonst misst die
     * Zahl unten die Wartepause und nicht das Laden. */
    let fertig = null;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 100));
      fertig = await js("(function () { var V = window.__viewer || {};" +
        " return { zeitraum: V.zeitraum, kerze: V.kerze, laeuft: !!V.laeuft, fest: (V.fest || []).length," +
        "   quelle: (document.getElementById('vwQuelle') || {}).textContent || '' }; })()");
      if (fertig.zeitraum === wohin && !fertig.laeuft && fertig.fest) break;
    }
    fertig.ms = Date.now() - t0;
    return fertig;
  }
  const n5J = await zeitraumKlick('5J');
  const nMax = await zeitraumKlick('Max');
  const n1M = await zeitraumKlick('1M');
  console.log('    Zeitraum 5J -> Kerze ' + n5J.kerze + ' (' + n5J.fest + ' Kerzen, ' + n5J.ms + ' ms)' +
    ' · Max -> ' + nMax.kerze + ' (' + nMax.fest + ' Kerzen, ' + nMax.ms + ' ms)' +
    ' · 1M -> Kerze ' + n1M.kerze + ' (' + n1M.fest + ' Kerzen, ' + n1M.ms + ' ms)');
  if (nMax.zeitraum !== 'Max' || nMax.kerze !== '1M') {
    funde.push('Viewer: Max setzt nicht die Monatskerze vor (' + nMax.zeitraum + '/' + nMax.kerze + ')');
  }
  if (n5J.zeitraum !== '5J' || n5J.kerze !== '1W') {
    funde.push('Viewer: 5J setzt nicht die Wochenkerze vor (' + n5J.zeitraum + '/' + n5J.kerze + ')');
  }
  if (n1M.zeitraum !== '1M' || n1M.kerze !== '1h') {
    funde.push('Viewer: 1M setzt nicht die Stundenkerze vor (' + n1M.zeitraum + '/' + n1M.kerze + ')');
  }
  /* Gegenprobe: die beiden Vorgaben sind verschieden - die Klinke oben kann also
   * nicht von einer Konstanten erfuellt werden. */
  if (n5J.kerze === n1M.kerze) {
    funde.push('Viewer: beide Zeitraeume setzen dieselbe Kerze vor - die Vorgabe-Klinke belegt nichts');
  }
  if (!String(n1M.quelle).trim()) funde.push('Viewer: nach dem Wechsel ist die Fusszeile stumm');

  /* ---- Rad-Zoom: weniger Kerzen im Bild, und wieder mehr ---- */
  async function rad(runter) {
    await js("(function () {" +
      " var c = document.getElementById('vwChart');" +
      " var r = c.getBoundingClientRect();" +
      " c.dispatchEvent(new WheelEvent('wheel', { deltaY: " + (runter ? '120' : '-120') +
      ", clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, cancelable: true }));" +
      " return 'ok'; })()");
    await new Promise((r) => setTimeout(r, 400));
    return js("(function () { var V = window.__viewer || {};" +
      " return { sichtbar: V.sichtbar ? V.sichtbar.kerzen.length : 0," +
      "   von: V.sichtbar ? V.sichtbar.fenster.von : -1, gesamt: V.sichtbar ? V.sichtbar.gesamt : 0 }; })()");
  }
  const vorZoom = await js("(function () { var V = window.__viewer || {};" +
    " return { sichtbar: V.sichtbar ? V.sichtbar.kerzen.length : 0 }; })()");
  const nachRein = await rad(false);
  const nachRaus = await rad(true);
  console.log('    Rad: ' + vorZoom.sichtbar + ' -> rein ' + nachRein.sichtbar + ' -> raus ' + nachRaus.sichtbar + ' Kerzen im Bild');
  if (!(nachRein.sichtbar < vorZoom.sichtbar)) {
    funde.push('Viewer: das Mausrad zoomt nicht hinein (' + vorZoom.sichtbar + ' -> ' + nachRein.sichtbar + ')');
  }
  /* Gegenprobe: dasselbe Ereignis in die andere Richtung muss es wieder aufmachen -
   * sonst misst die Klinke oben nur, dass sich IRGENDETWAS geaendert hat. */
  if (!(nachRaus.sichtbar > nachRein.sichtbar)) {
    funde.push('Viewer: Rad zurueck zoomt nicht wieder heraus (' + nachRein.sichtbar + ' -> ' + nachRaus.sichtbar + ')');
  }

  /* ---- Ziehen blaettert ---- */
  const gezogen = await js("(function () {" +
    " var c = document.getElementById('vwChart');" +
    " var V = window.__viewer || {};" +
    " var vorher = V.sichtbar ? V.sichtbar.fenster.von : -1;" +
    " var r = c.getBoundingClientRect();" +
    " var mitte = { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true };" +
    " c.dispatchEvent(new MouseEvent('mousemove', mitte));" +
    " var ohneZiehen = (window.__viewer.sichtbar || {}).fenster.von;" +
    " c.dispatchEvent(new MouseEvent('mousedown', mitte));" +
    " c.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + r.width / 2 + 120, clientY: mitte.clientY, bubbles: true }));" +
    " var mitZiehen = (window.__viewer.sichtbar || {}).fenster.von;" +
    " c.dispatchEvent(new MouseEvent('mouseup', mitte));" +
    " return { vorher: vorher, ohneZiehen: ohneZiehen, mitZiehen: mitZiehen }; })()");
  console.log('    Ziehen: Fensteranfang ' + gezogen.vorher + ' · nur Mausbewegung ' + gezogen.ohneZiehen +
    ' · mit gedrueckter Taste ' + gezogen.mitZiehen);
  if (gezogen.mitZiehen === gezogen.ohneZiehen) {
    funde.push('Viewer: Ziehen verschiebt das Fenster nicht (' + gezogen.ohneZiehen + ' -> ' + gezogen.mitZiehen + ')');
  }
  /* Gegenprobe: eine Mausbewegung OHNE gedrueckte Taste darf nichts verschieben -
   * sonst waere die Klinke oben schon von jedem Fadenkreuz erfuellt. */
  if (gezogen.ohneZiehen !== gezogen.vorher) {
    funde.push('Viewer: schon eine blosse Mausbewegung blaettert - das Fadenkreuz verschiebt das Bild');
  }

  /* ---- Der Uebergabepunkt an die Zeichenwerkzeuge (8c) ----
   * Haelt ein Werkzeug die Maus, gehoeren Ziehen und Doppelklick ihm. Geprueft wird
   * das VERHALTEN: ziehen, doppelklicken - das Fenster muss stehen bleiben.
   *
   * BIS ZUM EINBAU VON 8C setzte diese Probe `V.werkzeugAktiv` von Hand, weil es noch
   * kein Werkzeug gab, das es stellt. Seit es die Leiste gibt, waere das die falsche
   * Messung: 8c rechnet das Feld bei jedem Mausdruck aus seinem eigenen Zustand neu,
   * ein von aussen gesetztes Feld wird dabei ueberschrieben - die Probe haette also
   * einen Wert geprueft, den im Betrieb niemand so setzt. Jetzt wird der ECHTE Weg
   * gefahren: auf den Knopf "Linie" klicken, ziehen, doppelklicken. Das ist strenger,
   * nicht schwaecher - es haengt die Leiste mit in die Klinke. */
  const werkzeug = await js("(function () {" +
    " var c = document.getElementById('vwChart');" +
    " var r = c.getBoundingClientRect();" +
    " var V = window.__viewer;" +
    " var leiste = document.getElementById('vwWerkzeuge');" +
    " var knopfLinie = leiste && leiste.querySelector('button[data-werkzeug=\"linie\"]');" +
    " var knopfZeiger = leiste && leiste.querySelector('button[data-werkzeug=\"zeiger\"]');" +
    " if (!knopfLinie || !knopfZeiger) return { fehlt: true };" +
    " var mitte = { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true };" +
    " function ziehen() {" +
    "   c.dispatchEvent(new MouseEvent('mousedown', mitte));" +
    "   c.dispatchEvent(new MouseEvent('mousemove', { clientX: mitte.clientX + 140, clientY: mitte.clientY, bubbles: true }));" +
    "   c.dispatchEvent(new MouseEvent('mouseup', mitte));" +
    "   return V.sichtbar.fenster.von;" +
    " }" +
    " knopfLinie.click();" +
    " var gestellt = V.werkzeugAktiv;" +
    " var vorher = V.sichtbar.fenster.von;" +
    " var mitWerkzeug = ziehen();" +
    " c.dispatchEvent(new MouseEvent('dblclick', mitte));" +
    " var nachDoppelklick = V.sichtbar.fenster.von;" +
    " knopfZeiger.click();" +
    " var losgelassen = V.werkzeugAktiv;" +
    " var ohneWerkzeug = ziehen();" +
    " return { vorher: vorher, mitWerkzeug: mitWerkzeug, gestellt: gestellt," +
    "   losgelassen: losgelassen," +
    "   nachDoppelklick: nachDoppelklick, ohneWerkzeug: ohneWerkzeug }; })()");
  if (werkzeug.fehlt) {
    funde.push('Viewer: die Zeichenleiste fehlt - der Uebergabepunkt laesst sich nicht messen');
  }
  /* Dass die Leiste das Feld ueberhaupt stellt (und wieder loslaesst), gehoert
   * mitgeprueft: sonst bestuende die Klinke auch dann, wenn Ziehen aus einem ganz
   * anderen Grund nicht wirkt. */
  if (!werkzeug.fehlt && (werkzeug.gestellt !== true || werkzeug.losgelassen !== false)) {
    funde.push('Viewer: die Leiste stellt werkzeugAktiv nicht (gestellt=' +
      werkzeug.gestellt + ', nach Zeiger=' + werkzeug.losgelassen + ')');
  }
  console.log('    Werkzeug haelt die Maus: Fensteranfang ' + werkzeug.vorher +
    ' · ziehen ' + werkzeug.mitWerkzeug + ' · doppelklicken ' + werkzeug.nachDoppelklick +
    ' · Werkzeug los, ziehen ' + werkzeug.ohneWerkzeug);
  if (werkzeug.mitWerkzeug !== werkzeug.vorher || werkzeug.nachDoppelklick !== werkzeug.vorher) {
    funde.push('Viewer: bei aktivem Zeichenwerkzeug blaettert/zoomt der Chart trotzdem (' +
      werkzeug.vorher + ' -> ' + werkzeug.mitWerkzeug + '/' + werkzeug.nachDoppelklick + ')');
  }
  /* Gegenprobe: ohne Werkzeug muss dieselbe Geste wieder wirken - sonst haette die
   * Klinke oben auch ein kaputtes Ziehen fuer "richtig gesperrt" gehalten. */
  if (werkzeug.ohneWerkzeug === werkzeug.vorher) {
    funde.push('Viewer: ohne Werkzeug blaettert das Ziehen nicht mehr - die Sperre haelt zu viel fest');
  }

  /* ---- Zeichenwerkzeuge (8c) am laufenden Bild ----
   *
   * Der ganze Weg: Knopf klicken, zwei Klicks ins Chart, Objekt im Speicher, Farbe auf
   * der Ebene. Danach die Frage, um die es bei Zeichnungen eigentlich geht - ueberlebt
   * eine Linie das Zoomen? Gemessen wird beides: die PIXEL muessen sich verschieben
   * (sonst haette der Zoom gar nicht gewirkt und die Probe bestuende blind) und die
   * DATEN muessen gleich bleiben. */
  async function ebeneMalt() {
    return js("(function () {" +
      " var e = document.getElementById('vwEbene');" +
      " if (!e || !e.width) return 0;" +
      " var d = e.getContext('2d').getImageData(0, 0, e.width, e.height).data;" +
      " var n = 0; for (var i = 3; i < d.length; i += 4) if (d[i] > 8) n++;" +
      " return n; })()");
  }
  async function lageVonPunkt1() {
    return js("(function () {" +
      " var VZ = window.__zeichnungen, V = window.__viewer, Z = window.Zeichnungen;" +
      " if (!VZ || !VZ.liste.length || !V.skala) return null;" +
      " var p = VZ.liste[0].punkte[0];" +
      " var pr = Z.projektion(V.sichtbar.kerzen, V.skala);" +
      " return { t: p.t, kurs: p.kurs, x: pr.x(p.t), y: pr.y(p.kurs) }; })()");
  }
  const vorGezeichnet = await ebeneMalt();
  const gezeichnet8c = await js("(function () {" +
    " var c = document.getElementById('vwChart');" +
    " var leiste = document.getElementById('vwWerkzeuge');" +
    " var VZ = window.__zeichnungen;" +
    " if (!c || !leiste || !VZ) return { fehlt: true };" +
    " var r = c.getBoundingClientRect();" +
    " function klick(dx, dy) {" +
    "   var o = { clientX: r.left + dx, clientY: r.top + dy, bubbles: true, button: 0 };" +
    "   c.dispatchEvent(new MouseEvent('mousedown', o));" +
    "   c.dispatchEvent(new MouseEvent('mouseup', o));" +
    "   c.dispatchEvent(new MouseEvent('click', o));" +
    " }" +
    " var knopf = leiste.querySelector('button[data-werkzeug=\"linie\"]');" +
    " if (!knopf) return { fehlt: true };" +
    " knopf.click();" +
    " var nachEinem = (klick(120, 120), VZ.liste.length);" +
    " klick(360, 260);" +
    " return { fehlt: false, nachEinem: nachEinem, anzahl: VZ.liste.length," +
    "   punkte: VZ.liste.length ? VZ.liste[0].punkte.length : 0," +
    "   art: VZ.liste.length ? VZ.liste[0].art : ''," +
    "   werkzeugDanach: VZ.werkzeug }; })()");
  const nachGezeichnet = await ebeneMalt();
  const lageVor = await lageVonPunkt1();
  if (gezeichnet8c.fehlt) {
    funde.push('Viewer: die Zeichenleiste fehlt - mit zwei Klicks laesst sich nichts zeichnen');
  } else {
    console.log('    8c: nach einem Klick ' + gezeichnet8c.nachEinem + ' Zeichnungen, nach zweien ' +
      gezeichnet8c.anzahl + ' (' + gezeichnet8c.art + ', ' + gezeichnet8c.punkte +
      ' Punkte), Werkzeug danach ' + gezeichnet8c.werkzeugDanach +
      ' · Ebene ' + vorGezeichnet + ' -> ' + nachGezeichnet + ' Punkte');
    /* Der erste Klick darf noch NICHTS ablegen - sonst waere jede halb gesetzte
     * Linie schon eine Zeichnung, und ein Fehlklick liesse sich nicht abbrechen. */
    if (gezeichnet8c.nachEinem !== 0) {
      funde.push('Viewer 8c: schon der erste Klick legt eine Zeichnung an (' + gezeichnet8c.nachEinem + ')');
    }
    if (gezeichnet8c.anzahl !== 1 || gezeichnet8c.punkte !== 2 || gezeichnet8c.art !== 'linie') {
      funde.push('Viewer 8c: zwei Klicks ergeben keine Linie mit zwei Punkten (' +
        gezeichnet8c.anzahl + '/' + gezeichnet8c.punkte + '/' + gezeichnet8c.art + ')');
    }
    if (nachGezeichnet <= vorGezeichnet) {
      funde.push('Viewer 8c: auf der Zeichenebene ist nichts zu sehen (' +
        vorGezeichnet + ' -> ' + nachGezeichnet + ')');
    }
  }
  /* Rad-Zoom: die Linie muss ihm folgen. */
  await js("(function () {" +
    " var c = document.getElementById('vwChart');" +
    " var r = c.getBoundingClientRect();" +
    " c.dispatchEvent(new WheelEvent('wheel', { deltaY: -240," +
    "   clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, cancelable: true }));" +
    " return 'ok'; })()");
  await new Promise((r) => setTimeout(r, 250));
  const lageNach = await lageVonPunkt1();
  if (lageVor && lageNach) {
    console.log('    8c: Punkt 1 vor dem Zoom x=' + Math.round(lageVor.x) +
      ', danach x=' + Math.round(lageNach.x) + ' · Zeitstempel gleich=' + (lageVor.t === lageNach.t));
    if (lageVor.t !== lageNach.t || lageVor.kurs !== lageNach.kurs) {
      funde.push('Viewer 8c: das Zoomen hat die DATEN der Zeichnung veraendert - sie liegt in Pixeln, nicht in Daten');
    }
    /* Gegenprobe zur Klinke oben: haette der Zoom gar nichts bewegt, waere
     * "Daten unveraendert" wertlos - dann misst die Probe nur Stillstand. */
    if (Math.abs(lageVor.x - lageNach.x) < 1) {
      funde.push('Viewer 8c: der Rad-Zoom hat die Linie nicht verschoben - die Zoom-Klinke misst nichts');
    }
  } else if (!gezeichnet8c.fehlt) {
    funde.push('Viewer 8c: nach dem Zoomen ist die Zeichnung nicht mehr auffindbar');
  }
  /* Entf loescht die ausgewaehlte Zeichnung. */
  const nachEntf = await js("(function () {" +
    " var feld = document.querySelector('.vwZeichenFeld');" +
    " var VZ = window.__zeichnungen;" +
    " if (!feld || !VZ) return -1;" +
    " VZ.ausgewaehlt = VZ.liste.length ? VZ.liste[0].id : null;" +
    " feld.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));" +
    " return VZ.liste.length; })()");
  console.log('    8c: nach Entf ' + nachEntf + ' Zeichnungen');
  if (!gezeichnet8c.fehlt && nachEntf !== 0) {
    funde.push('Viewer 8c: Entf loescht die ausgewaehlte Zeichnung nicht (' + nachEntf + ')');
  }
  /* Wert wechseln und zurueck: die Zeichnungen gehoeren dem Kuerzel. */
  await js("(function () {" +
    " var c = document.getElementById('vwChart');" +
    " var leiste = document.getElementById('vwWerkzeuge');" +
    " var r = c.getBoundingClientRect();" +
    " function klick(dx, dy) {" +
    "   var o = { clientX: r.left + dx, clientY: r.top + dy, bubbles: true, button: 0 };" +
    "   c.dispatchEvent(new MouseEvent('mousedown', o));" +
    "   c.dispatchEvent(new MouseEvent('mouseup', o));" +
    "   c.dispatchEvent(new MouseEvent('click', o));" +
    " }" +
    " leiste.querySelector('button[data-werkzeug=\"horizontale\"]').click();" +
    " klick(200, 180);" +
    " return 'ok'; })()");
  await new Promise((r) => setTimeout(r, 200));
  const vorWechsel = await js("(function () { return window.__zeichnungen.liste.length; })()");
  await js("(function () { window.Explorer.oeffne('KUNSTB', 'Kunst B'); return 'ok'; })()");
  await new Promise((r) => setTimeout(r, 2500));
  const beimAnderen = await js("(function () { return window.__zeichnungen.liste.length; })()");
  await js("(function () { window.Explorer.oeffne('" + sym + "', 'Kunst A'); return 'ok'; })()");
  await new Promise((r) => setTimeout(r, 2500));
  const zurueck = await js("(function () {" +
    " var VZ = window.__zeichnungen;" +
    " return { anzahl: VZ.liste.length, sym: VZ.sym," +
    "   art: VZ.liste.length ? VZ.liste[0].art : '' }; })()");
  console.log('    8c: bei KUNSTA ' + vorWechsel + ' Zeichnungen, bei KUNSTB ' + beimAnderen +
    ', zurueck bei KUNSTA ' + zurueck.anzahl + ' (' + zurueck.art + ')');
  if (vorWechsel !== 1) {
    funde.push('Viewer 8c: die Horizontale wurde nicht angelegt (' + vorWechsel + ')');
  }
  /* Gegenprobe: der ANDERE Wert darf sie nicht zeigen - sonst haengen die
   * Zeichnungen am Programm statt am Kuerzel, und der Rueckweg bewiese nichts. */
  if (beimAnderen !== 0) {
    funde.push('Viewer 8c: der andere Wert zeigt fremde Zeichnungen (' + beimAnderen + ')');
  }
  if (zurueck.anzahl !== 1 || zurueck.art !== 'horizontale') {
    funde.push('Viewer 8c: nach dem Rueckwechsel ist die Zeichnung nicht wieder da (' +
      zurueck.anzahl + '/' + zurueck.art + ')');
  }
  /* Aufraeumen: die Probe laesst keine Zeichnung im Speicher der Instanz stehen. */
  await js("(function () {" +
    " var p = document.getElementById('vzPapierkorb');" +
    " if (p) { p.click(); p.click(); }" +
    " return window.__zeichnungen.liste.length; })()");

  /* ---- Signal-Schalter: werden wirklich Marken gezeichnet? ----
   * Die Kunst-Reihe traegt seit dem 05.09.2026 Bewegung; auf der alten Geraden
   * schlug kein Detektor an, und ein leerer Chart haette hier bestanden. */
  async function schalter(an) {
    await js("(function () {" +
      " var cb = document.querySelector('#vwEinblenden input[data-sig=\"cross\"]');" +
      " if (!cb) return 'kein Schalter';" +
      " cb.checked = " + (an ? 'true' : 'false') + ";" +
      " cb.dispatchEvent(new Event('change', { bubbles: true }));" +
      " return 'ok'; })()");
    await new Promise((r) => setTimeout(r, 900));
    return js("(function () { var V = window.__viewer || {};" +
      " return { punkte: (V.punkte || []).length," +
      "   marken: V.gezeichnet ? V.gezeichnet.marken : -1," +
      "   liste: (document.getElementById('vwSigListe') || {}).textContent || ''," +
      "   zahl: (document.getElementById('vwSigZahl') || {}).textContent || '' }; })()");
  }
  const sigAus = await schalter(false);
  const sigAn = await schalter(true);
  console.log('    Signal-Schalter aus: ' + sigAus.punkte + ' Punkte / ' + sigAus.marken + ' Marken · ' +
    'an: ' + sigAn.punkte + ' Punkte / ' + sigAn.marken + ' Marken · ' + String(sigAn.zahl).slice(0, 60));
  if (!(sigAn.punkte > 0)) {
    funde.push('Viewer: mit eingeschaltetem Detektor findet der Kunst-Chart kein einziges Signal - die Probe kann Marken nicht belegen');
  }
  if (!(sigAn.marken > 0)) {
    funde.push('Viewer: es werden keine Signal-Marken gezeichnet (' + sigAn.marken + ')');
  }
  /* Gegenprobe: ausgeschaltet darf keine einzige Marke stehen. */
  if (sigAus.marken !== 0 || sigAus.punkte !== 0) {
    funde.push('Viewer: ausgeschaltet bleiben Marken stehen (' + sigAus.punkte + ' Punkte / ' + sigAus.marken + ' Marken)');
  }
  /* Und die Liste unter dem Chart nennt das Urteil - nicht der Viewer selbst. */
  if (sigAn.liste.indexOf('Studienregister') === -1 && sigAn.liste.indexOf('Protokoll') === -1) {
    funde.push('Viewer: die Signal-Liste nennt keinen Belegstand aus dem Studienregister');
  }

  /* ---- F2: ein Zustand, drei Orte, dieselben Worte ---- */
  await js("(function () { var b = document.querySelector('nav.tabs [data-tab=\"markt\"]'); if (b) b.click(); " +
           "var p = document.querySelector('#tab-markt .pills [data-sub=\"marktueberblick\"]'); if (p) p.click(); return 'ok'; })()");
  await new Promise((r) => setTimeout(r, 1200));
  const w = await js("(function () {" +
    " function txt(id) { var e = document.getElementById(id); return e ? (e.textContent || '').replace(/\\s+/g, ' ').trim() : null; }" +
    " var Z = null;" +
    " if (window.MarktUebersicht && window.Quant) {" +
    "   var l = window.Boerse ? window.Boerse.sitzungsMinuten(Date.now()) : 390;" +
    "   Z = window.MarktUebersicht.sitzungszustand(window.Quant.minutenSeitOeffnung(Date.now()), l);" +
    " }" +
    " return { wort: Z ? Z.kurz : null, stamp: txt('stamp'), ck: txt('ckMarkt'), markt: txt('marktSitzung') }; })()");
  console.log('    F2: Wort "' + w.wort + '" | Kopf: ' + w.stamp + ' | Cockpit: ' + w.ck + ' | Markt: ' + String(w.markt).slice(0, 90));
  if (!w.wort) {
    funde.push('F2: der Sitzungszustand liess sich nicht rechnen - die Probe belegt nichts');
  } else {
    [['Kopfzeile #stamp', w.stamp], ['Cockpit #ckMarkt', w.ck], ['Reiter Markt #marktSitzung', w.markt]]
      .forEach(function (o) {
        if (o[1] === null) { funde.push('F2: ' + o[0] + ' gibt es nicht'); return; }
        if (o[1].indexOf(w.wort) === -1) {
          funde.push('F2: ' + o[0] + ' sagt "' + o[1].slice(0, 60) + '" statt "' + w.wort + '"');
        }
      });
  }
  /* Die alte Formel darf nirgends mehr stehen - sie war der zweite Begriff. */
  const alt = [w.stamp, w.ck, w.markt].filter(function (s) { return s && /US-Börse (geöffnet|geschlossen)/.test(s); });
  if (alt.length) funde.push('F2: der alte Zweitbegriff steht noch da: ' + alt.join(' | '));

  /* ---- F7: der Fokus ueberlebt ein Neuschreiben der Hotlists ----
   * Ausgeloest wird das Neuschreiben ueber sub-changed - denselben Weg, den auch
   * der Pillen-Wechsel nimmt. Ein echtes Warten auf den Minutentakt haette die
   * Probe um eine Minute verlaengert und dasselbe belegt. */
  const f7 = await js("(function () {" +
    " var e = document.getElementById('marktHotlists');" +
    " var b = e && e.querySelector('[data-marktsym]');" +
    " if (!b) return { moeglich: false };" +
    " var vorher = b.getAttribute('data-marktsym');" +
    " b.focus();" +
    " var stand1 = document.activeElement === b;" +
    " document.dispatchEvent(new CustomEvent('sub-changed', { detail: { sub: 'marktueberblick' } }));" +
    " var a = document.activeElement;" +
    " var nachher = a && a.getAttribute ? a.getAttribute('data-marktsym') : null;" +
    " return { moeglich: true, vorher: vorher, nachher: nachher, stand1: stand1," +
    "   marke: a ? (a.tagName + (nachher ? '[' + nachher + ']' : '')) : 'nichts'," +
    "   zeilen: e.querySelectorAll('[data-marktsym]').length }; })()");
  if (!f7.moeglich) {
    console.log('    F7: keine Hotlist-Zeile da - nicht gemessen (Kunstdaten ohne gemerkten Stand)');
  } else {
    console.log('    F7: Fokus vor dem Neuschreiben ' + f7.vorher + ', danach ' + f7.marke +
      ' (' + f7.zeilen + ' Zeilen)');
    if (!f7.stand1) funde.push('F7: der Fokus liess sich gar nicht erst setzen - die Probe belegt nichts');
    else if (f7.nachher !== f7.vorher) {
      funde.push('F7: der Fokus ist beim Neuschreiben von ' + f7.vorher + ' nach ' + f7.marke + ' gefallen');
    }
  }
  /* ---- F8: die Sitzungszeile bei 1024 px ----
   * Der Fund war, dass sie dort auf DREI Zeilen umbricht, sobald die Stoerungs-
   * meldung dazukommt. Gemessen wird deshalb an beiden Breiten und MIT Meldung -
   * ohne sie war die Zeile schon vorher einzeilig, und die Messung belegte nichts. */
  const zeilenhoehe = async function (breite) {
    win.setContentSize(breite, 820);
    await new Promise((r) => setTimeout(r, 700));
    return js("(function () {" +
      " var e = document.getElementById('marktSitzung'); if (!e) return null;" +
      " var z = e.querySelector('.sitzungZeile'), s = e.querySelector('.sitzungStoerung');" +
      " var rz = z ? z.getBoundingClientRect() : null, rs = s ? s.getBoundingClientRect() : null;" +
      " return { ganz: Math.round(e.getBoundingClientRect().height)," +
      "   zeile: rz ? Math.round(rz.height) : null," +
      "   stoerung: rs ? Math.round(rs.height) : null," +
      "   hatStoerung: !!s, breite: window.innerWidth }; })()");
  };
  const m1280 = await zeilenhoehe(1280);
  const m1024 = await zeilenhoehe(1024);
  win.setContentSize(1280, 820);
  await new Promise((r) => setTimeout(r, 400));
  console.log('    F8: #marktSitzung 1280 px -> ' + JSON.stringify(m1280));
  console.log('    F8: #marktSitzung 1024 px -> ' + JSON.stringify(m1024));
  [[1280, m1280], [1024, m1024]].forEach(function (x) {
    var m = x[1];
    if (!m) { funde.push('F8: #marktSitzung gibt es bei ' + x[0] + ' px nicht'); return; }
    /* Der ZUSTAND ist eine Zeile. Die Stoerungsmeldung darf umbrechen - sie ist ein
     * Satz, kein Etikett -, aber sie steht darunter und nicht IN der Zeile. */
    if (m.zeile === null) { funde.push('F8: bei ' + x[0] + ' px fehlt die Zustandszeile'); return; }
    if (m.zeile > 26) {
      funde.push('F8: bei ' + x[0] + ' px ist der Sitzungszustand ' + m.zeile + ' px hoch - er bricht um');
    }
    if (m.hatStoerung && m.stoerung === null) {
      funde.push('F8: bei ' + x[0] + ' px steht die Stoerungsmeldung nicht in ihrer eigenen Zeile');
    }
  });

  /* ================= Chart-Einstellungen (Viewer 8b) =================
   *
   * Was hier gemessen wird und warum es nur HIER geht:
   *   - Der Dialog geht ueber den Stapel auf und liegt SICHTBAR obenauf
   *     (elementFromPoint, nicht classList - das war QS-Fund B1).
   *   - Alle vier Reiter schalten ihren Inhalt um. Ein Reiter, der nichts tut,
   *     sieht im Quelltext genauso aus wie einer, der etwas tut.
   *   - Eine geaenderte Farbe kommt WIRKLICH auf die Leinwand. Gezaehlt werden
   *     Bildpunkte - dass ein Feld seinen Wert geaendert hat, sagt nichts darueber,
   *     ob der Chart neu gezeichnet wurde.
   *   - Ok und Abbrechen sind UNTERSCHIEDEN: nach Abbrechen muss die Farbe weg
   *     sein. Ein Abbrechen, das uebernimmt, ist schlimmer als keines.
   */
  await js("(function () { var b = document.querySelector('nav.tabs [data-tab=\"werkzeuge\"]'); if (b) b.click(); " +
           "var p = document.querySelector('#wzPills [data-sub=\"explorer\"]'); if (p) p.click(); return 'ok'; })()");
  await new Promise((r) => setTimeout(r, 500));

  /* Die Zahl der Bildpunkte einer Farbe auf der Leinwand. Toleranz 8 je Kanal:
   * der Zeichner malt mit Kantenglaettung, ein exakter Vergleich faende deshalb
   * auch dann nichts, wenn die Farbe da ist. */
  const PIXELZAEHLER =
    "function zaehl(r0, g0, b0) {" +
    " var c = document.getElementById('vwChart'); if (!c) return -1;" +
    " var d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, n = 0;" +
    " for (var i = 0; i < d.length; i += 4) {" +
    "   if (Math.abs(d[i] - r0) < 8 && Math.abs(d[i+1] - g0) < 8 && Math.abs(d[i+2] - b0) < 8) n++;" +
    " } return n; }";

  const cs0 = await js("(function () {" + PIXELZAEHLER +
    " var z = document.getElementById('vwEinstellungen');" +
    " return { knopf: !!z, magenta: zaehl(255, 0, 255) }; })()");
  if (!cs0.knopf) funde.push('8b: der Zahnrad-Knopf ueber dem Chart fehlt');
  console.log('    8b: Zahnrad da=' + cs0.knopf + ', Magenta-Punkte vorher=' + cs0.magenta);
  if (cs0.magenta > 0) funde.push('8b: die Probefarbe steht schon vor der Aenderung auf der Leinwand (' + cs0.magenta + ')');

  /* Geoeffnet wird mit einem ECHTEN Mausklick: element.click() fokussiert den Knopf
   * nicht, und die Fokus-Rueckgabe waere danach nicht gemessen, sondern geglaubt. */
  /* IN DEN BLICK ROLLEN, DANN messen. Ein sendInputEvent nimmt Fenster-Koordinaten:
   * liegt der Knopf unter der Kante, trifft der Klick eine andere Stelle - und die
   * Probe meldete "der Knopf oeffnet nichts", obwohl niemand ihn gedrueckt hat. */
  const zPos = await js("(function () { var z = document.getElementById('vwEinstellungen');" +
    " if (!z) return null; z.scrollIntoView({ block: 'center' });" +
    " var r = z.getBoundingClientRect();" +
    " return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2)," +
    "   imBild: r.top >= 0 && r.bottom <= window.innerHeight," +
    "   chartSet: typeof window.ChartSet, modul: typeof window.ChartEinstellungen }; })()");
  console.log('    8b: Knopf bei ' + (zPos ? zPos.x + '/' + zPos.y + ' imBild=' + zPos.imBild +
    ' ChartSet=' + zPos.chartSet + ' Modul=' + zPos.modul : 'nicht gefunden'));
  if (zPos && zPos.chartSet !== 'object') funde.push('8b: window.ChartSet fehlt - chartset.js faehrt nicht mit');
  if (zPos && !zPos.imBild) funde.push('8b: der Zahnrad-Knopf laesst sich nicht in den Blick rollen');
  async function zahnradKlicken() {
    if (!zPos) return;
    win.webContents.sendInputEvent({ type: 'mouseDown', x: zPos.x, y: zPos.y, button: 'left', clickCount: 1 });
    win.webContents.sendInputEvent({ type: 'mouseUp', x: zPos.x, y: zPos.y, button: 'left', clickCount: 1 });
    await new Promise((r) => setTimeout(r, 450));
  }
  await zahnradKlicken();

  const cs1 = await js("(function () {" +
    " var bg = document.getElementById('chartSetModalBg'); if (!bg) return { da: false, reiter: [] };" +
    " var kasten = bg.querySelector('.modal'); var r = kasten.getBoundingClientRect();" +
    " var oben = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);" +
    " return { da: true, offen: bg.classList.contains('open')," +
    "   ebene: bg.style.zIndex || ''," +
    "   obenauf: !!(oben && bg.contains(oben))," +
    "   reiter: Array.prototype.map.call(bg.querySelectorAll('#csReiter button[data-reiter]')," +
    "     function (b) { return b.getAttribute('data-reiter'); })," +
    "   felder: bg.querySelectorAll('#csInhalt .csZeile').length }; })()");
  console.log('    8b: Dialog offen=' + cs1.offen + ', Ebene ' + cs1.ebene + ', obenauf=' + cs1.obenauf +
    ', Reiter ' + (cs1.reiter || []).join('/') + ', Felder im ersten Reiter ' + cs1.felder);
  if (!cs1.offen) funde.push('8b: der Zahnrad-Knopf oeffnet den Einstellungen-Dialog nicht');
  if (cs1.offen && !cs1.obenauf) funde.push('8b: der Dialog ist offen, liegt aber nicht sichtbar obenauf');
  if (cs1.offen && !cs1.ebene) funde.push('8b: der Dialog hat keine Ebene aus dem Stapel bekommen');
  if ((cs1.reiter || []).length !== 4) funde.push('8b: ' + (cs1.reiter || []).length + ' Reiter statt vier');
  if (!cs1.felder) funde.push('8b: der erste Reiter ist leer');

  /* Jeder Reiter muss den Inhalt WECHSELN. Verglichen werden die Beschriftungen -
   * die Zahl der Zeilen allein koennte zufaellig gleich sein. */
  const reiterStand = [];
  for (const rn of (cs1.reiter || [])) {
    await js("(function () { var b = document.getElementById('csReiter-" + rn + "'); if (b) b.click(); return 'ok'; })()");
    await new Promise((r) => setTimeout(r, 150));
    const st = await js("(function () {" +
      " var i = document.getElementById('csInhalt');" +
      " var gewaehlt = document.querySelector('#csReiter button[aria-selected=\"true\"]');" +
      " return { zeilen: i.querySelectorAll('.csZeile').length," +
      "   text: Array.prototype.map.call(i.querySelectorAll('.csZeile > label')," +
      "     function (l) { return (l.textContent || '').trim(); }).join('|')," +
      "   aktiv: gewaehlt ? gewaehlt.getAttribute('data-reiter') : null }; })()");
    reiterStand.push({ reiter: rn, zeilen: st.zeilen, aktiv: st.aktiv, text: st.text });
    if (st.aktiv !== rn) funde.push('8b: Klick auf Reiter ' + rn + ' setzt aria-selected nicht (' + st.aktiv + ')');
    if (!st.zeilen) funde.push('8b: Reiter ' + rn + ' zeigt keine Felder');
  }
  console.log('    8b: Reiter-Felder ' + reiterStand.map(function (r) { return r.reiter + '=' + r.zeilen; }).join(' '));
  const texte = reiterStand.map(function (r) { return r.text; });
  if (new Set(texte).size !== texte.length) funde.push('8b: zwei Reiter zeigen denselben Inhalt - einer schaltet nicht');

  /* Die Farbe. Gesetzt wird ueber das Feld, das die Feldtabelle gebaut hat - nicht
   * ueber den Speicher: gemessen werden soll der WEG durch den Dialog. */
  async function farbeSetzen() {
    return js("(function () {" +
      " var b = document.getElementById('csReiter-symbol'); if (b) b.click();" +
      " var f = document.querySelectorAll('#csInhalt input[type=\"color\"]');" +
      " if (!f.length) return { ok: false, felder: 0 };" +
      /* ALLE sechs Farbfelder des Reiters, nicht nur das erste: die Koerper der
       * Kunst-Kerzen sind ein bis zwei Bildpunkte hoch, die Dochte dagegen lang.
       * Mit nur einem Feld hing die Messung an sechs Bildpunkten - richtig, aber
       * zu knapp, um eine Regression sicher zu fangen. */
      " for (var i = 0; i < f.length; i++) {" +
      "   f[i].value = '#ff00ff';" +
      "   f[i].dispatchEvent(new Event('input', { bubbles: true }));" +
      " }" +
      " return { ok: true, wert: f[0].value, felder: f.length }; })()");
  }
  const gesetzt = await farbeSetzen();
  await new Promise((r) => setTimeout(r, 400));
  const cs2 = await js("(function () {" + PIXELZAEHLER + " return zaehl(255, 0, 255); })()");
  console.log('    8b: Farbfelder ' + gesetzt.felder + ', nach der Aenderung Magenta-Punkte=' + cs2);
  if (!gesetzt.ok) funde.push('8b: im Reiter Symbol gibt es kein Farbfeld');
  if (!(cs2 > 0)) funde.push('8b: die geaenderte Farbe erscheint NICHT auf der Leinwand (' + cs2 + ' Punkte)');

  /* ABBRECHEN muss sie wieder wegnehmen. */
  await js("(function () { var b = document.getElementById('csAbbrechen'); if (b) b.click(); return 'ok'; })()");
  await new Promise((r) => setTimeout(r, 400));
  const cs3 = await js("(function () {" + PIXELZAEHLER +
    " var bg = document.getElementById('chartSetModalBg');" +
    " return { magenta: zaehl(255, 0, 255), offen: bg.classList.contains('open') }; })()");
  console.log('    8b: nach Abbrechen Magenta-Punkte=' + cs3.magenta + ', Dialog offen=' + cs3.offen);
  if (cs3.offen) funde.push('8b: Abbrechen schliesst den Dialog nicht');
  if (cs3.magenta > 0) funde.push('8b: Abbrechen nimmt die Farbe nicht zurueck (' + cs3.magenta + ' Punkte)');

  /* OK muss sie behalten - sonst waeren beide Knoepfe dasselbe. */
  await zahnradKlicken();
  await farbeSetzen();
  await new Promise((r) => setTimeout(r, 250));
  await js("(function () { var b = document.getElementById('csOk'); if (b) b.click(); return 'ok'; })()");
  await new Promise((r) => setTimeout(r, 400));
  const cs4 = await js("(function () {" + PIXELZAEHLER +
    " var bg = document.getElementById('chartSetModalBg');" +
    " return { magenta: zaehl(255, 0, 255), offen: bg.classList.contains('open') }; })()");
  console.log('    8b: nach Ok Magenta-Punkte=' + cs4.magenta + ', Dialog offen=' + cs4.offen);
  if (cs4.offen) funde.push('8b: Ok schliesst den Dialog nicht');
  if (!(cs4.magenta > 0)) funde.push('8b: Ok uebernimmt die Farbe nicht (' + cs4.magenta + ' Punkte)');
  if (cs4.magenta > 0 && cs3.magenta > 0) funde.push('8b: Ok und Abbrechen sind nicht unterschieden');

  /* Zurueck auf den Standard - die folgenden Aufnahmen sollen nicht magenta sein. */
  await zahnradKlicken();
  await js("(function () { var b = document.getElementById('csZuruecksetzen'); if (b) b.click();" +
           " var o = document.getElementById('csOk'); if (o) o.click(); return 'ok'; })()");
  await new Promise((r) => setTimeout(r, 400));
  const cs5 = await js("(function () {" + PIXELZAEHLER + " return zaehl(255, 0, 255); })()");
  if (cs5 > 0) funde.push('8b: Zuruecksetzen laesst die Probefarbe stehen (' + cs5 + ' Punkte)');

  /* Die Ereignis-Marken: das Kunst-Archiv fuehrt eine Dividende und einen Split.
   * Ohne sie waere der Schalter gruen, ohne je eine Marke gezeichnet zu haben. */
  await js("(function () { var b = document.querySelector('#vwKerze [data-kerze=\"1T\"]'); if (b && !b.disabled) b.click(); return 'ok'; })()");
  await new Promise((r) => setTimeout(r, 1800));
  const ereig = await js("(function () { var V = window.__viewer || {};" +
    " return { gezeichnet: (V.gezeichnet || {}).ereignisse || 0," +
    "   tipps: (V.ereignisTipps || []).length," +
    "   ganz: JSON.stringify(V.gezeichnet || null)," +
    "   sichtbar: V.sichtbar ? V.sichtbar.kerzen.length : 0," +
    "   quellen: V.ereignisse ? Object.keys(V.ereignisse).join(',') : '' }; })()");
  console.log('    8b: Zeichenergebnis ' + ereig.ganz + ', sichtbar ' + ereig.sichtbar);
  console.log('    8b: Ereignis-Marken gezeichnet=' + ereig.gezeichnet + ', Tooltips=' + ereig.tipps +
    ', Quellen=' + ereig.quellen);
  if (!(ereig.gezeichnet > 0)) {
    funde.push('8b: keine Ereignis-Marke gezeichnet, obwohl das Kunst-Archiv Dividende und Split fuehrt');
  }
  if (ereig.tipps !== ereig.gezeichnet) {
    funde.push('8b: ' + ereig.gezeichnet + ' Marken, aber ' + ereig.tipps + ' Tooltips - jede Marke braucht einen');
  }

  return funde;
}

/* ================= Das Laufband: laeuft es wirklich? =================
 * Textmarken sehen ein "animation: tickLauf", nicht eine Spur, die sich bewegt.
 * Gemessen wird deshalb am laufenden Fenster:
 *   - die Spur liegt doppelt (sonst reisst die Schleife),
 *   - die gerechnete Dauer passt zur gemessenen Breite (gleiche Pixel je Sekunde),
 *   - die Verschiebung waechst zwischen zwei Blicken,
 *   - unter dem Mauszeiger und bei Fokus steht sie still.
 * POSITIVKONTROLLE: bewegt sich in der Vergleichsspanne gar nichts, ist das ein
 * Befund ueber die SONDE (kein Band, keine Animation) und nicht ein Beleg.
 * Ohne Schlagzeilen ist das Band ausgeblendet - dann sagt die Probe das und misst
 * nichts; mit --leer ist genau das der Normalfall. */
async function laufbandPruefen(win, js) {
  const funde = [];
  await js("(function () { var b = document.querySelector('nav.tabs [data-tab=\"markt\"]'); if (b) b.click();" +
    " var s = document.querySelector('#tab-markt .pills [data-sub=\"marktueberblick\"]'); if (s) s.click(); })()");
  await new Promise((r) => setTimeout(r, 400));
  const da = await js("(function () { var e = document.getElementById('newsTicker');" +
    " return { da: !!e, sichtbar: !!(e && e.offsetWidth > 0 && e.style.display !== 'none')," +
    " teile: e ? e.querySelectorAll('.tickTeil').length : 0," +
    " kopie: e ? e.querySelectorAll('.tickKopie').length : 0," +
    " meldungen: e && e.querySelector('.tickTeil') ? e.querySelector('.tickTeil').querySelectorAll('a').length : 0," +
    " schalter: document.documentElement.getAttribute('data-laufband') }; })()");
  if (!da.da) { funde.push('Laufband: #newsTicker steht nicht im DOM'); return { funde }; }
  if (!da.sichtbar) {
    console.log('  Laufband: ausgeblendet (keine Schlagzeilen) - nicht messbar, kein Befund');
    return { funde };
  }
  if (da.teile !== 2 || da.kopie !== 1) {
    funde.push('Laufband: ' + da.teile + ' Spurhaelften und ' + da.kopie + ' Kopie(n) - fuer die nahtlose Schleife braucht es genau zwei und eine');
  }
  const tempo = await js("(function () { var t = window.Dash && window.Dash.bandTempo ? window.Dash.bandTempo() : null;" +
    " var e = document.getElementById('newsTicker');" +
    " var sp = e && e.querySelector('.tickSpur');" +
    " var st = sp ? getComputedStyle(sp) : null;" +
    " return { t: t, rahmen: e ? e.clientWidth : 0, dauer: st ? st.animationDuration : null," +
    " lauf: st ? st.animationPlayState : null, name: st ? st.animationName : null }; })()");
  if (!tempo.t) funde.push('Laufband: window.Dash.bandTempo() misst nichts - die Spur hat keine Breite');
  else {
    const pxs = tempo.t.pxs;
    console.log('  Laufband: ' + da.meldungen + ' Meldungen, Spurhaelfte ' + Math.round(tempo.t.breite) +
      ' px, Rahmen ' + tempo.rahmen + ' px, Dauer ' + tempo.t.dauer.toFixed(1) + ' s = ' +
      pxs.toFixed(1) + ' px/s (CSS sagt ' + tempo.dauer + ', Animation ' + tempo.name + ')');
    if (!(pxs > 40 && pxs < 90)) funde.push('Laufband: ' + pxs.toFixed(1) + ' px/s liegt ausserhalb des erwarteten Tempos (40-90)');
    if (tempo.name !== 'tickLauf') funde.push('Laufband: die Spur traegt die Animation "' + tempo.name + '" statt tickLauf');
  }
  /* Bewegt sie sich? Zwei Blicke auf die Matrix der Spur, 700 ms auseinander. */
  const versatz = () => js("(function () { var sp = document.querySelector('#newsTicker .tickSpur');" +
    " if (!sp) return null; var m = getComputedStyle(sp).transform;" +
    " if (!m || m === 'none') return 0;" +
    " try { return new DOMMatrix(m).m41; } catch (e) { return 0; } })()");
  const v1 = await versatz();
  await new Promise((r) => setTimeout(r, 700));
  const v2 = await versatz();
  const gewandert = Math.abs((v2 || 0) - (v1 || 0));
  console.log('  Laufband: Verschiebung in 700 ms = ' + gewandert.toFixed(1) + ' px (' + v1 + ' -> ' + v2 + ')');
  if (da.schalter !== 'aus' && !(gewandert > 5)) {
    funde.push('Laufband: die Spur hat sich in 700 ms um ' + gewandert.toFixed(1) +
      ' px bewegt - bei eingeschaltetem Band muss sie laufen (data-laufband=' + da.schalter + ')');
  }
  /* Und sie steht still, solange der Fokus im Band ist (dasselbe CSS wie bei Hover). */
  await js("(function () { var e = document.getElementById('newsTicker'); if (e) e.focus(); })()");
  await new Promise((r) => setTimeout(r, 200));
  const f1 = await versatz();
  await new Promise((r) => setTimeout(r, 600));
  const f2 = await versatz();
  const beiFokus = Math.abs((f2 || 0) - (f1 || 0));
  console.log('  Laufband: Verschiebung bei Fokus = ' + beiFokus.toFixed(1) + ' px (soll 0)');
  if (beiFokus > 2) funde.push('Laufband: es laeuft weiter, obwohl der Fokus darin steht (' + beiFokus.toFixed(1) + ' px) - die gewaehlte Meldung wandert weg');
  /* Die aktuelle Meldung und die Tastatur. */
  const taste = await js("(function () { var e = document.getElementById('newsTicker');" +
    " function evt(k) { e.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); }" +
    " var vorher = e.querySelectorAll('a.tickAktiv').length;" +
    " evt('ArrowRight'); evt('ArrowRight');" +
    " var akt = e.querySelector('a.tickAktiv');" +
    " var erste = e.querySelector('.tickTeil');" +
    " var alle = erste ? Array.prototype.slice.call(erste.querySelectorAll('a')) : [];" +
    " return { vorher: vorher, markiert: e.querySelectorAll('a.tickAktiv').length," +
    " stelle: akt ? alle.indexOf(akt) : -1 }; })()");
  console.log('  Laufband: nach zwei Pfeiltasten ist Meldung ' + taste.stelle + ' markiert (' + taste.markiert + ' Markierung)');
  if (taste.markiert !== 1) funde.push('Laufband: ' + taste.markiert + ' Meldungen sind markiert - es muss genau eine sein');
  if (taste.stelle !== 2) funde.push('Laufband: nach zwei Pfeiltasten steht die Marke auf Meldung ' + taste.stelle + ' statt 2');
  await js("document.activeElement && document.activeElement.blur && document.activeElement.blur(), 'ok'");
  return { funde };
}

/* ================= U3: die Statuszeile der Klappe "Kursarchiv" =================
 * Der Fund (QS 04.09.2026): 'sub-changed' feuert SYNCHRON beim Aufklappen, die
 * Archiv-Auskunft steht aber erst eine Runde spaeter - danach loeste nichts mehr
 * aus, und wer nur das Kursarchiv ansah, sah die Zeile nie.
 * Gemessen wird der Zusammenhang, nicht ein fester Text: hat Archivkarte.letzter()
 * Zeilen, muss die Statuszeile etwas sagen. Hat sie keine, ist der Fall nicht
 * pruefbar - und DAS wird gesagt, statt gruen zu melden. */
async function archivZeilePruefen(win, js) {
  const funde = [];
  await js("(function () { var b = document.querySelector('nav.tabs [data-tab=\"werkzeuge\"]'); if (b) b.click();" +
    " var s = document.querySelector('#tab-werkzeuge .pills [data-sub=\"betrieb\"]'); if (s) s.click(); })()");
  await new Promise((r) => setTimeout(r, 300));
  /* Erst schliessen, dann oeffnen - sonst misst die Probe eine Klappe, die schon
   * einmal offen war, und der Fund lag genau im ERSTEN Oeffnen. */
  await js("(function () { var d = document.querySelector('#sub-betrieb details[data-klappe=\"archiv\"]');" +
    " if (d) { d.open = false; } var e = document.getElementById('kstand-archiv'); if (e) e.textContent = ''; })()");
  const sofort = await js("(function () { var d = document.querySelector('#sub-betrieb details[data-klappe=\"archiv\"]');" +
    " if (!d) return null; d.open = true;" +
    " var e = document.getElementById('kstand-archiv');" +
    " return { zeile: e ? e.textContent : null }; })()");
  if (!sofort) { funde.push('U3: die Klappe "Kursarchiv" steht nicht mehr im Maschinenraum'); return { funde }; }
  await new Promise((r) => setTimeout(r, 2500));
  const danach = await js("(function () { var e = document.getElementById('kstand-archiv');" +
    " var st = window.Archivkarte && window.Archivkarte.letzter ? window.Archivkarte.letzter() : null;" +
    " return { zeile: e ? e.textContent : null, zeilen: st && st.zeilen ? st.zeilen.length : 0 }; })()");
  console.log('  U3 Kursarchiv-Statuszeile: beim Aufklappen "' + (sofort.zeile || '') +
    '", 2,5 s spaeter "' + (danach.zeile || '') + '" (Auskunft hat ' + danach.zeilen + ' Zeilen)');
  if (!danach.zeilen) {
    console.log('    (Die Auskunft liefert keine Zeilen - der Fall ist in dieser Instanz nicht pruefbar, kein Beleg.)');
  } else if (!String(danach.zeile || '').trim()) {
    funde.push('U3: die Auskunft hat ' + danach.zeilen + ' Zeilen, die Statuszeile bleibt leer');
  }
  return { funde };
}

/* ================= Live-Sammler: die Panel-Zeile aus Attrappen-Zahlen =================
 * Der Live-Sammler laeuft in dieser Instanz nie (kein Schluessel, kein Netz). Ob die
 * Karte seine Zeile ZEIGT, laesst sich trotzdem messen: zeichne() bekommt einen Stand
 * mit erfundenen Zahlen, und danach muessen genau diese Zahlen im Panel stehen und
 * der Schalter als Kaestchen da sein. Kein Abruf wird ausgeloest - zeichne() zeigt nur.
 * window.api ist schreibgeschuetzt (contextBridge), deshalb geht der Weg ueber die
 * Zeichenfunktion und nicht ueber eine Attrappe der Auskunft. */
async function liveZeilePruefen(win, js) {
  const funde = [];
  await js("(function () { var b = document.querySelector('nav.tabs [data-tab=\"werkzeuge\"]'); if (b) b.click();" +
    " var s = document.querySelector('#tab-werkzeuge .pills [data-sub=\"betrieb\"]'); if (s) s.click();" +
    " var d = document.querySelector('#sub-betrieb details[data-klappe=\"archiv\"]'); if (d) d.open = true; })()");
  await new Promise((r) => setTimeout(r, 1500));
  const erg = await js("(function () {" +
    " if (!window.Archivkarte || !window.Archivkarte.zeichne) return { da: false };" +
    " var alt = window.Archivkarte.letzter();" +
    " var st = alt ? JSON.parse(JSON.stringify(alt)) : { einstellungen: { universum: 'top500', intervalle: { '1m': 1, '5m': 7, '15m': 7, '60m': 1, '1d': 1 }, nachSchlussMinuten: 30, abstandMs: 1200 }, zeilen: [], stillstand: [] };" +
    " st.einstellungen = st.einstellungen || {}; st.einstellungen.live = true;" +
    " st.live = { moeglich: true, an: true, aktiv: true, werte: 512, letzteRunde: Date.now(), bis: Date.now() - 18 * 60000, anfragen: 3, takt: 300000, deckel: 150," +
    "   schreibBytes: 12582912, schreibMs: 800," +
    "   zeile: 'Alpaca live: 512 Werte · letzte Runde 15:47 · bis 15:32 ET · Abrufe je Runde 3 · geschrieben 12 MB in 0,8 s' };" +
    " window.Archivkarte.zeichne(st, null);" +
    " var z = document.getElementById('archLiveZeile'); var k = document.getElementById('archLiveAn');" +
    " var sichtbar = z ? (z.getClientRects().length > 0) : false;" +
    " return { da: true, zeile: z ? z.textContent : null, sichtbar: sichtbar, kasten: !!k, an: k ? k.checked : null, gesperrt: k ? k.disabled : null }; })()");
  if (!erg || !erg.da) { funde.push('Live-Sammler: window.Archivkarte.zeichne fehlt - die Zeile ist nicht pruefbar'); return { funde }; }
  console.log('  Live-Sammler-Zeile: "' + (erg.zeile || '') + '" sichtbar=' + erg.sichtbar + ' Kaestchen=' + erg.kasten + ' an=' + erg.an + ' gesperrt=' + erg.gesperrt);
  if (!erg.zeile || erg.zeile.indexOf('512 Werte') === -1 || erg.zeile.indexOf('Abrufe je Runde 3') === -1 ||
      erg.zeile.indexOf('geschrieben 12 MB') === -1) {
    funde.push('Live-Sammler: die Panel-Zeile zeigt die Attrappen-Zahlen nicht ("' + (erg.zeile || '') + '")');
  }
  if (!erg.sichtbar) funde.push('Live-Sammler: die Panel-Zeile steht im DOM, ist aber nicht sichtbar');
  if (!erg.kasten || erg.an !== true || erg.gesperrt !== false) {
    funde.push('Live-Sammler: der Schalter fehlt oder steht falsch (da=' + erg.kasten + ', an=' + erg.an + ', gesperrt=' + erg.gesperrt + ')');
  }
  /* Positivkontrolle: ohne Zugang muss die Zeile den Grund nennen und der Schalter gesperrt sein. */
  const ohne = await js("(function () { var st = JSON.parse(JSON.stringify(window.Archivkarte.letzter()));" +
    " st.live = { moeglich: false, an: true, aktiv: false, zeile: 'Alpaca live: aus — kein Alpaca-Zugang in den App-Einstellungen' };" +
    " window.Archivkarte.zeichne(st, null);" +
    " var z = document.getElementById('archLiveZeile'); var k = document.getElementById('archLiveAn');" +
    " return { zeile: z ? z.textContent : null, gesperrt: k ? k.disabled : null }; })()");
  if (!ohne || !/kein Alpaca-Zugang/.test(String(ohne.zeile || '')) || ohne.gesperrt !== true) {
    funde.push('Live-Sammler: ohne Zugang fehlt der Grund in der Zeile oder der Schalter ist nicht gesperrt');
  }
  /* Den echten Stand wiederherstellen, damit die naechste Sonde nicht die Attrappe misst. */
  await js("(function () { if (window.Archivkarte && window.Archivkarte.laden) window.Archivkarte.laden(); })()");
  await new Promise((r) => setTimeout(r, 800));
  return { funde };
}

/* ================= Schein-Finder: filtert er wirklich ohne Neuladen? =================
 *
 * Der Kern der Stufe 7 laesst sich im Quelltext nicht pruefen: dass eine Drehung an
 * einer Auswahlliste die Tabelle SOFORT aendert und dabei KEINEN Kursabruf ausloest.
 * Ein Textabtaster sieht nur, dass zeige() verdrahtet ist - nicht, ob es wirkt.
 *
 * "Laden & rechnen" steht auf der Klick-Sperrliste. Deshalb wird vorher
 * window.api.fetchText durch die Attrappe aus tools/kunstinstanz.js ersetzt: der
 * Knopf laeuft seinen echten Weg, aber es geht nichts ins Netz. Die Attrappe zaehlt
 * jeden Abruf mit - daran haengt der eigentliche Nachweis.
 */
async function scheinFinderPruefen(win, js) {
  const funde = [];
  await js("(function () { var b = document.querySelector('nav.tabs [data-tab=\"werkzeuge\"]'); if (b) b.click(); " +
           "var p = document.querySelector('#wzPills [data-sub=\"scheine\"]'); if (p) p.click(); return 'ok'; })()");
  await new Promise((r) => setTimeout(r, 300));

  /* Die Listen muessen schon dastehen, BEVOR etwas geladen wurde - sie kommen aus
   * der Tabelle, nicht aus dem Raster. */
  const vorher = await js("(function () {" +
    " var ids = ['sfTyp','sfStufe','sfHebel','sfLaufzeit','sfSpanne','sfTv','sfBand','sfSort'];" +
    " var da = ids.filter(function (i) { return !!document.getElementById(i); });" +
    " var opt = {}; da.forEach(function (i) { opt[i] = document.getElementById(i).options.length; });" +
    " return { listen: da.length, optionen: opt," +
    "   knoepfe: document.querySelectorAll('#sfVoreinstellungen [data-sfvor]').length," +
    "   schalter: !!document.getElementById('sfAlleSpalten')," +
    "   leerzustand: !!document.querySelector('#sfTabelle .empty') }; })()");
  console.log('    Schein-Finder: ' + vorher.listen + ' Listen, ' + vorher.knoepfe + ' Voreinstellungs-Knoepfe' +
    ', Schalter ' + (vorher.schalter ? 'da' : 'FEHLT') + ', Leerzustand ' + (vorher.leerzustand ? 'da' : 'FEHLT'));
  if (vorher.listen !== 8) funde.push('Schein-Finder: ' + vorher.listen + ' von 8 Auswahllisten im DOM');
  if (vorher.knoepfe !== 3) funde.push('Schein-Finder: ' + vorher.knoepfe + ' statt drei Voreinstellungs-Knoepfe');
  if (!vorher.schalter) funde.push('Schein-Finder: der Schalter "alle Kennzahlen" fehlt');
  if (!vorher.leerzustand) funde.push('Schein-Finder: ohne Raster steht kein Leerzustand unter den Listen');
  Object.keys(vorher.optionen || {}).forEach(function (i) {
    if (!vorher.optionen[i]) funde.push('Schein-Finder: die Liste ' + i + ' ist leer - sie wird nicht aus scheinwahl.js gefuellt');
  });

  /* Jetzt die Attrappe, dann der Knopf. */
  const KI = require(path.join(__dirname, 'kunstinstanz.js'));
  /* Der Abruf-Zaehler `window.__kunstAbrufe` ist GLOBAL - er zaehlt jeden Abruf
   * der Instanz, auch die Hintergrundtakte anderer Bildschirme (der Viewer holt
   * im Minutentakt seinen Kurs). Gezaehlt werden hier deshalb nur die Abrufe, die
   * das Kuerzel des Schein-Finders nennen: sonst schreibt die Probe einen fremden
   * Abruf dem gerade geklickten Knopf zu (Fund 05.09.2026). */
  const attrappe = await js(KI.scheinAttrappeCode(Date.now()));
  if (attrappe !== 'attrappe') funde.push('Schein-Finder: die Kurs-Attrappe liess sich nicht setzen (' + attrappe + ') - der Knopf haette echt geladen');
  await js("(function () { var e = document.getElementById('sfSymbol'); if (e) e.value = '" + KI.scheinSymbol() + "'; return 'ok'; })()");
  await js("(function () { var b = document.getElementById('sfLadenBtn'); if (b) b.click(); return 'ok'; })()");
  await new Promise((r) => setTimeout(r, 1200));

  const geladen = await js("(function () {" +
    " var t = document.getElementById('sfTabelle');" +
    " return { zeilen: t ? t.querySelectorAll('tbody tr[data-sfi]').length : 0," +
    "   spalten: t ? t.querySelectorAll('thead th').length : 0," +
    "   pillen: t ? t.querySelectorAll('.sf-stufe').length : 0," +
    "   treffer: (document.getElementById('sfTreffer') || {}).textContent || ''," +
    "   status: (document.getElementById('sfStatus') || {}).textContent || ''," +
    "   abrufe: (window.__kunstAbrufe || []).filter(function (u) { return String(u).indexOf('" + KI.scheinSymbol() + "') >= 0; }).length }; })()");
  console.log('    Schein-Finder geladen: ' + geladen.zeilen + ' Zeilen, ' + geladen.spalten + ' Spalten, ' +
    geladen.pillen + ' Stufen-Pillen, "' + String(geladen.treffer).trim() + '", ' + geladen.abrufe + ' Abrufe');
  console.log('    Statuszeile: ' + String(geladen.status).slice(0, 140));
  if (!geladen.zeilen) {
    funde.push('Schein-Finder: nach "Laden & rechnen" steht keine Zeile in der Tabelle - Status: ' +
      String(geladen.status).slice(0, 120));
    return { funde };   // ohne Raster sind die weiteren Pruefungen sinnlos
  }
  if (geladen.spalten !== 7) funde.push('Schein-Finder: ' + geladen.spalten + ' statt sieben Spalten in der Vorgabe');
  if (geladen.pillen !== geladen.zeilen) {
    funde.push('Schein-Finder: ' + geladen.pillen + ' Stufen-Pillen bei ' + geladen.zeilen + ' Zeilen - jede Zeile braucht ihre Stufe');
  }
  if (!/von \d+ Scheinen/.test(geladen.treffer)) {
    funde.push('Schein-Finder: die Trefferzahl sagt nicht "N von M Scheinen": "' + geladen.treffer + '"');
  }

  /* ---- DER EIGENTLICHE PUNKT: filtern ohne neu zu laden ---- */
  const abrufeVorher = geladen.abrufe;
  /* Gewaehlt wird die SPANNE und nicht der Totalverlust, obwohl der naheliegender
   * klingt: In diesem Kunst-Raster liegt der Totalverlust der Vorgabe-Auswahl
   * ohnehin bei hoechstens 20,9 % - die Stufengrenze schneidet alles darueber schon
   * weg, und "hoechstens 25 %" aenderte nichts. Die erste Fassung dieser Sonde hat
   * daraus einen Befund gemacht und dem Code etwas vorgeworfen, was an ihrer
   * eigenen Erwartung lag (04.09.2026). Die Spanne beisst nachweislich: 59 -> 35.
   * Geprueft wird in BEIDE Richtungen - eine Tabelle, die einfach stehenbleibt,
   * bestuende sonst die Haelfte der Pruefung. */
  const nachFilter = await js("(function () {" +
    " var e = document.getElementById('sfSpanne');" +
    " e.value = '0.5'; e.dispatchEvent(new Event('change'));" +
    " var t = document.getElementById('sfTabelle');" +
    " return { zeilen: t ? t.querySelectorAll('tbody tr[data-sfi]').length : 0," +
    "   treffer: (document.getElementById('sfTreffer') || {}).textContent || ''," +
    "   abrufe: (window.__kunstAbrufe || []).filter(function (u) { return String(u).indexOf('" + KI.scheinSymbol() + "') >= 0; }).length }; })()");
  console.log('    Enger (Spanne hoechstens 0,5 %): ' + nachFilter.zeilen + ' Zeilen, "' +
    String(nachFilter.treffer).trim() + '", Abrufe ' + abrufeVorher + ' -> ' + nachFilter.abrufe);
  if (nachFilter.abrufe !== abrufeVorher) {
    funde.push('Schein-Finder: das Umstellen einer Liste hat ' + (nachFilter.abrufe - abrufeVorher) +
      ' Abruf(e) ausgeloest - gefiltert wird im Speicher, geladen nur mit dem Knopf');
  }
  if (nachFilter.zeilen >= geladen.zeilen) {
    funde.push('Schein-Finder: der strengere Filter hat die Liste nicht verkleinert (' +
      geladen.zeilen + ' -> ' + nachFilter.zeilen + ') - die Liste wirkt nicht');
  }
  /* Und wieder auf: die Zahl muss zurueckkommen. Sonst kann eine Sonde nicht
   * unterscheiden, ob die Liste filtert oder die Tabelle nur einmal kleiner wurde. */
  const wiederAuf = await js("(function () {" +
    " var e = document.getElementById('sfSpanne');" +
    " e.value = '100'; e.dispatchEvent(new Event('change'));" +
    " var t = document.getElementById('sfTabelle');" +
    " return { zeilen: t ? t.querySelectorAll('tbody tr[data-sfi]').length : 0," +
    "   abrufe: (window.__kunstAbrufe || []).filter(function (u) { return String(u).indexOf('" + KI.scheinSymbol() + "') >= 0; }).length }; })()");
  console.log('    Wieder auf (Spanne egal): ' + wiederAuf.zeilen + ' Zeilen');
  if (wiederAuf.zeilen <= nachFilter.zeilen) {
    funde.push('Schein-Finder: das Lockern des Filters bringt keine Zeilen zurueck (' +
      nachFilter.zeilen + ' -> ' + wiederAuf.zeilen + ')');
  }
  if (wiederAuf.abrufe !== abrufeVorher) {
    funde.push('Schein-Finder: das Lockern des Filters hat einen Kursabruf ausgeloest');
  }

  /* ---- Der Schalter zeigt alle Kennzahlen ---- */
  const nachSchalter = await js("(function () {" +
    " var e = document.getElementById('sfAlleSpalten');" +
    " e.checked = true; e.dispatchEvent(new Event('change'));" +
    " var t = document.getElementById('sfTabelle');" +
    " return { spalten: t ? t.querySelectorAll('thead th').length : 0," +
    "   abrufe: (window.__kunstAbrufe || []).filter(function (u) { return String(u).indexOf('" + KI.scheinSymbol() + "') >= 0; }).length }; })()");
  console.log('    Schalter "alle Kennzahlen": ' + nachSchalter.spalten + ' Spalten');
  if (nachSchalter.spalten !== 15) {
    funde.push('Schein-Finder: der Schalter zeigt ' + nachSchalter.spalten + ' statt fuenfzehn Spalten');
  }
  if (nachSchalter.abrufe !== abrufeVorher) {
    funde.push('Schein-Finder: der Spalten-Schalter hat einen Kursabruf ausgeloest');
  }

  /* ---- Die drei Voreinstellungen setzen wirklich alle Listen ---- */
  const vor = await js("(function () {" +
    " var lies = function () { return ['sfTyp','sfStufe','sfHebel','sfLaufzeit','sfSpanne','sfTv','sfSort']" +
    "   .map(function (i) { return document.getElementById(i).value; }).join('|'); };" +
    " var aus = {};" +
    " ['defensiv','ausgewogen','offensiv'].forEach(function (n) {" +
    "   document.querySelector('#sfVoreinstellungen [data-sfvor=\"' + n + '\"]').click();" +
    "   var t = document.getElementById('sfTabelle');" +
    "   aus[n] = { wahl: lies(), zeilen: t.querySelectorAll('tbody tr[data-sfi]').length };" +
    " });" +
    " aus.abrufe = (window.__kunstAbrufe || []).filter(function (u) { return String(u).indexOf('" + KI.scheinSymbol() + "') >= 0; }).length;" +
    " return aus; })()");
  ['defensiv', 'ausgewogen', 'offensiv'].forEach(function (n) {
    console.log('    Voreinstellung ' + n.padEnd(11) + vor[n].wahl + '  -> ' + vor[n].zeilen + ' Zeilen');
    if (!vor[n].zeilen) funde.push('Schein-Finder: Voreinstellung "' + n + '" zeigt keine einzige Zeile');
  });
  if (vor.defensiv.wahl === vor.offensiv.wahl) {
    funde.push('Schein-Finder: "defensiv" und "offensiv" setzen dieselben Werte - die Knoepfe tun nichts');
  }
  if (vor.abrufe !== abrufeVorher) {
    funde.push('Schein-Finder: ein Voreinstellungs-Knopf hat einen Kursabruf ausgeloest');
  }

  /* ---- Die Begruendung klappt unter der Zeile auf ---- */
  const auf = await js("(function () {" +
    " var tr = document.querySelector('#sfTabelle tbody tr[data-sfi]'); if (!tr) return { da: false };" +
    " tr.click();" +
    " var n = tr.nextElementSibling;" +
    " return { da: !!(n && n.className === 'sf-inline')," +
    "   spannt: n ? parseInt(n.querySelector('td').getAttribute('colspan'), 10) : 0," +
    "   text: n ? (n.textContent || '').slice(0, 90) : '' }; })()");
  console.log('    Zeile aufgeklappt: ' + (auf.da ? 'ja, colspan=' + auf.spannt : 'NEIN') + ' – ' + auf.text);
  if (!auf.da) funde.push('Schein-Finder: ein Klick auf die Zeile klappt die Risiko-Begruendung nicht auf');
  else if (auf.spannt !== nachSchalter.spalten) {
    funde.push('Schein-Finder: die aufgeklappte Zeile spannt ueber ' + auf.spannt + ' von ' +
      nachSchalter.spalten + ' Spalten');
  }
  return { funde };
}

async function probe(win) {
  const wc = win.webContents;
  const js = (code) => wc.executeJavaScript(code, true);
  /* Fehlerzaehler in die Seite legen. Er faengt ab jetzt - fruehe Startfehler
   * stehen ersatzweise in konsoleFehler (console-message, nur als Hinweis). */
  await js("window.__probe = { fehler: [] };" +
    "window.addEventListener('error', function (e) { window.__probe.fehler.push(String(e.message || e)); });" +
    "window.addEventListener('unhandledrejection', function (e) { window.__probe.fehler.push('unhandled: ' + String(e.reason && e.reason.message || e.reason)); });" +
    "'bereit'");
  const tabs = await js("Array.prototype.map.call(document.querySelectorAll('nav.tabs button[data-tab]'), function (b) { return b.getAttribute('data-tab'); })");
  if (!tabs || !tabs.length) throw new Error('keine Reiter gefunden');
  const probleme = [];
  let pillen = 0;
  for (const tab of tabs) {
    const okTab = await js("(function () {" +
      "var b = document.querySelector('nav.tabs [data-tab=\"" + tab + "\"]'); if (!b) return 'kein Knopf';" +
      "b.click();" +
      "var p = document.getElementById('tab-" + tab + "');" +
      "return p && p.classList.contains('active') ? 'ok' : 'Panel nicht aktiv'; })()");
    if (okTab !== 'ok') probleme.push('Reiter ' + tab + ': ' + okTab);
    const subs = await js("Array.prototype.map.call(document.querySelectorAll('#tab-" + tab + " .pills button[data-sub]'), function (b) { return b.getAttribute('data-sub'); })");
    for (const sub of (subs || [])) {
      pillen++;
      const okSub = await js("(function () {" +
        "var b = document.querySelector('#tab-" + tab + " .pills [data-sub=\"" + sub + "\"]'); if (!b) return 'kein Knopf';" +
        "b.click();" +
        "var p = document.getElementById('sub-" + sub + "');" +
        "return p && p.classList.contains('active') ? 'ok' : 'Unterseite nicht aktiv'; })()");
      if (okSub !== 'ok') probleme.push('Pille ' + tab + '/' + sub + ': ' + okSub);
      await new Promise((r) => setTimeout(r, 150));
    }
  }
  /* ---- Verhaltenstest: der Intraday-Bereich (Oberflaeche Stufe 2) ----
   * Ist die Intraday-Strategie aus, wird der Behaelter AUSGEBLENDET - und zwar per
   * hidden, nicht durch Entfernen: depot.js render() schreibt ohne Null-Pruefung in
   * #depotStats, messband.js haengt sein Band als erstes Kind in #sub-depot. Ein
   * Umbau, der die Elemente herausnimmt, wuerde beides STILL brechen - kein
   * Textmarken-Test im Quelltext kann das sehen.
   * Geprueft wird der Zusammenhang, nicht ein fester Zustand: hidden genau dann,
   * wenn die Strategie aus ist. In der frischen Instanz ist sie aus (Vorgabe), mit
   * tools/ui-aufnahmen.js --kunstdaten an - dieselbe Zusicherung deckt beide Faelle
   * ab und hat damit ihre eigene Positivkontrolle. */
  const bereich = await js("(function () {" +
    "var el = document.getElementById('intradayBereich');" +
    "var rs = window.DepotAPI && window.DepotAPI.regelStatus ? window.DepotAPI.regelStatus() : null;" +
    "return { da: !!el, hidden: el ? !!el.hidden : null, an: rs ? !!rs.intradayAn : null," +
    " stats: !!document.getElementById('depotStats')," +
    " messband: !!document.getElementById('sub-depot')," +
    " karten: ['buchMomentumKopf', 'buchDriftKopf', 'buchIntradayKopf']" +
    "   .filter(function (i) { return !!document.getElementById(i); }).length }; })()");
  if (!bereich.da) probleme.push('#intradayBereich fehlt im DOM');
  else if (bereich.an === null) probleme.push('DepotAPI.regelStatus() antwortet nicht - Zustand nicht pruefbar');
  else if (bereich.hidden === bereich.an) {
    probleme.push('Intraday-Bereich: hidden=' + bereich.hidden + ' bei intradayAn=' + bereich.an +
      ' - er muss genau dann versteckt sein, wenn die Strategie aus ist');
  }
  if (!bereich.stats) probleme.push('#depotStats steht nicht mehr im DOM - render() schriebe ins Leere');
  if (!bereich.messband) probleme.push('#sub-depot steht nicht mehr im DOM - messband.js faende seinen Anker nicht');
  if (bereich.karten !== 3) probleme.push('Es stehen ' + bereich.karten + ' statt 3 Buecher-Karten im DOM');
  console.log('  Intraday-Bereich: hidden=' + bereich.hidden + ', Strategie an=' + bereich.an +
    ', Karten=' + bereich.karten);

  /* ---- Bildlauf bei beiden Breiten ---- */
  for (const breite of BREITEN) {
    const bl = await bildlaufPruefen(win, js, breite);
    bl.funde.forEach(function (f) {
      probleme.push('Bildlauf bei ' + breite + ' px: ' + f.seite + ' ist ' + f.ueber +
        ' px breiter als das Fenster (scrollWidth ' + f.scrollWidth + ' > clientWidth ' +
        f.clientWidth + ')' + (f.ort ? ' - ganz rechts ' + f.ort + ' bis x=' + f.rechts : ''));
    });
    console.log('  Bildlauf bei ' + breite + ' px: ' + bl.flaechen + ' Flaechen gemessen, ' +
      (bl.funde.length ? bl.funde.length + ' zu breit' : 'keine zu breit'));
  }

  /* ---- Fokus: zwei Wanderungen ----
   * Markt, weil dort das Laufband steht und der Minutentakt schreibt; Werkzeuge ->
   * Betrieb, weil der Maschinenraum bei zugeklappten Klappen genau zwoelf Halte
   * haben soll und eine Fokusfalle dort am teuersten waere. */
  const bekannteRot = [];
  const gesehen = {};
  if (!(await dialogeSchliessen(js))) {
    probleme.push('Fokus: es blieb ein Modaldialog offen - die Wanderung waere in ihm gelaufen, nicht in der Oberflaeche');
  }
  const wegMarkt = await tabWanderung(win, js, 'markt', 'marktueberblick', 20);
  fokusAuswerten('markt', wegMarkt, probleme, bekannteRot, gesehen);
  const wegBetrieb = await tabWanderung(win, js, 'werkzeuge', 'betrieb', 20);
  fokusAuswerten('werkzeuge', wegBetrieb, probleme, bekannteRot, gesehen);
  /* POSITIVKONTROLLE. Kommt die Taste nicht an - kein Fensterfokus, ein Dialog
   * davor -, bleibt der Fokus stehen, die Wanderung meldet "0 draussen" und belegt
   * damit gar nichts. Eine Wanderung, die nicht wandert, ist ein Befund ueber die
   * SONDE, und der muss lauter sein als ihr Ergebnis. */
  [['markt', wegMarkt], ['werkzeuge/betrieb', wegBetrieb]].forEach(function (x) {
    const halte = {};
    x[1].forEach(function (a) { halte[a.ort] = (halte[a.ort] || 0) + 1; });
    const zahl = Object.keys(halte).length;
    console.log('  Fokus ' + x[0] + ': ' + x[1].length + ' Schritte, ' + zahl + ' verschiedene Halte, ' +
      x[1].filter(function (a) { return a.draussen; }).length + ' ausserhalb des Fensters');
    console.log('    Weg: ' + x[1].map(function (a) {
      return a.ort + (a.ausserhalb ? ' (AUSSERHALB)' : a.geschoben ? ' (SCHOB ' + a.geschoben + ')' : '');
    }).join(' · '));
    if (zahl < 3) probleme.push('Fokus ' + x[0] + ': die Wanderung ist nicht gewandert (' + zahl +
      ' verschiedene Halte in ' + x[1].length + ' Schritten) - die Tab-Taste kam nicht an, das Ergebnis belegt nichts');
  });
  /* Ein bekannter Fund, der NICHT mehr auftritt, ist behoben - und sein Eintrag
   * gehoert gestrichen, sonst deckelt er irgendwann einen Rueckfall. */
  const erledigt = BEKANNTE_ABWEICHUNGEN
    .filter(function (a) { return !a.sporadisch && !gesehen[a.fund]; })
    .map(function (a) { return a.fund + ' (' + a.quelle + ') tritt nicht mehr auf - Eintrag in BEKANNTE_ABWEICHUNGEN streichen'; });

  /* Der Aktien-Viewer, F2 und F7 - alles drei nur am laufenden Fenster messbar. */
  const vwFunde = await viewerPruefen(win, js);
  vwFunde.forEach(function (f) { probleme.push(f); });

  /* Das Laufband und die Statuszeile des Kursarchivs - beides Verhalten, das eine
   * Textmarke im Quelltext nicht sehen kann (04.09.2026). */
  (await laufbandPruefen(win, js)).funde.forEach(function (f) { probleme.push(f); });
  (await archivZeilePruefen(win, js)).funde.forEach(function (f) { probleme.push(f); });
  /* Die Zeile des Live-Sammlers, aus Attrappen-Zahlen (06.09.2026). */
  (await liveZeilePruefen(win, js)).funde.forEach(function (f) { probleme.push(f); });
  /* Der Schein-Finder: Live-Filter, Spalten, Voreinstellungen (Stufe 7, 04.09.2026). */
  (await scheinFinderPruefen(win, js)).funde.forEach(function (f) { probleme.push(f); });

  const seitenFehler = await js('window.__probe.fehler.slice(0, 20)');
  /* Ein abgebrochenes init() faengt depot.js selbst ab und meldet es NUR im
   * Warnband - die Schaltung funktioniert dann trotzdem, und genau so waere der
   * Q-Fehler der Migrations-Auslagerung (25.08.2026) hier fast durchgerutscht.
   * Deshalb ist das Warnband Teil der Probe. */
  const warnband = await js("(document.getElementById('warnband') || {}).textContent || ''");
  if (/nicht vollständig starten|nicht vollstaendig starten/.test(warnband)) {
    probleme.push('Warnband meldet init-Abbruch: ' + String(warnband).slice(0, 120));
  }
  return { tabs: tabs.length, pillen, probleme, bekannteRot, erledigt, seitenFehler: seitenFehler || [] };
}

/* Hartes Zeitlimit: eine haengende Probe ist ein Befund, kein Grund zu warten.
 * 300 s statt der frueheren 90: die Probe geht die Flaechen dreimal ab - einmal
 * fuer die Schaltung, je einmal fuer 1024 und 1280 px - und wandert danach zweimal
 * mit echten Tastendruecken durch die Oberflaeche. */
setTimeout(() => { console.error('UI-Probe: Zeitlimit (300 s) erreicht.'); app.exit(2); }, 300000);

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  win.webContents.on('console-message', (e2, level, message) => {
    if (level >= 3) konsoleFehler.push(String(message).slice(0, 200));
  });
  win.webContents.once('did-finish-load', async () => {
    try {
      /* Die Start-Renderings (Skeletons, erste Abrufe) kurz abwarten - die Probe
       * misst die Schaltung, nicht das Netz. */
      await new Promise((r) => setTimeout(r, 4000));
      const erg = await probe(win);
      console.log('UI-Probe: ' + erg.tabs + ' Reiter, ' + erg.pillen + ' Pillen geschaltet.');
      erg.probleme.forEach((p) => console.error('BEFUND Schaltung: ' + p));
      erg.seitenFehler.forEach((f) => console.error('BEFUND unbehandelter Fehler: ' + f));
      /* Bekannt rot steht im Protokoll, nicht im Exit-Code - mit Fundstelle, damit
       * niemand raten muss, ob das ein Deckel oder ein offener Auftrag ist. */
      erg.bekannteRot.forEach((b) => console.log('BEKANNT ROT ' + b));
      erg.erledigt.forEach((b) => console.log('ERLEDIGT: ' + b));
      if (konsoleFehler.length) {
        console.log('Hinweis: ' + konsoleFehler.length + ' console.error-Meldung(en) - im Offline-Betrieb meist Netzabrufe, kein Befund:');
        konsoleFehler.slice(0, 5).forEach((f) => console.log('  · ' + f));
      }
      const rot = erg.probleme.length + erg.seitenFehler.length;
      console.log(rot ? 'UI-Probe ROT: ' + rot + ' Befund(e).' : 'UI-Probe gruen.');
      app.exit(rot ? 1 : 0);
    } catch (e) {
      console.error('UI-Probe abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
