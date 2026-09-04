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
    " var kn = document.querySelectorAll('#vwZeitrahmen button[data-zeitrahmen]');" +
    " var c = document.getElementById('vwChart');" +
    " var V = window.__viewer || {};" +
    " return { knoepfe: Array.prototype.map.call(kn, function (b) { return b.getAttribute('data-zeitrahmen'); })," +
    "   aktiv: (document.querySelector('#vwZeitrahmen button.active') || {}).textContent || ''," +
    "   quelle: (document.getElementById('vwQuelle') || {}).textContent || ''," +
    "   kopf: (document.getElementById('vwKopf') || {}).textContent || ''," +
    "   belegstand: (document.getElementById('vwBelegstand') || {}).textContent || ''," +
    "   canvasBreite: c ? c.width : 0, canvasHoehe: c ? c.height : 0," +
    "   fest: (V.fest || []).length, sichtbar: V.sichtbar ? V.sichtbar.kerzen.length : 0," +
    "   nurRegulaer: !!V.nurRegulaer }; })()");
  console.log('    Viewer: ' + z.knoepfe.length + ' Zeitrahmen (' + z.knoepfe.join(' ') + '), aktiv ' + z.aktiv +
    ', ' + z.fest + ' Kerzen geladen, ' + z.sichtbar + ' im Bild, Canvas ' + z.canvasBreite + 'x' + z.canvasHoehe);
  console.log('    Fusszeile: ' + String(z.quelle).slice(0, 160));
  if (z.knoepfe.length !== 6) funde.push('Viewer: ' + z.knoepfe.length + ' Zeitrahmen-Knoepfe statt sechs');
  if (!z.canvasBreite) funde.push('Viewer: die Zeichenflaeche hat keine Breite - es wurde nichts gezeichnet');
  if (!z.fest) funde.push('Viewer: keine Kerze geladen, obwohl das Kunst-Archiv eine Reihe fuer ' + sym + ' fuehrt');
  if (!String(z.quelle).trim()) funde.push('Viewer: die Fusszeile ist stumm - sie muss immer sagen, woher die Kerzen kommen');
  if (String(z.quelle).indexOf('Archiv') === -1 && String(z.quelle).indexOf('Alpaca') === -1) {
    funde.push('Viewer: die Fusszeile nennt das Archiv nicht: ' + String(z.quelle).slice(0, 80));
  }
  if (!String(z.belegstand).trim()) funde.push('Viewer: der Wegweiser zum Belegstand fehlt');

  /* Zeitrahmen wechseln: die Knoepfe muessen wirklich etwas tun. */
  await js("(function () { var b = document.querySelector('#vwZeitrahmen [data-zeitrahmen=\"1h\"]'); if (b) b.click(); return 'ok'; })()");
  await new Promise((r) => setTimeout(r, 2500));
  const nach = await js("(function () { var V = window.__viewer || {};" +
    " return { zr: V.zeitrahmen, quelle: (document.getElementById('vwQuelle') || {}).textContent || ''," +
    "   fest: (V.fest || []).length }; })()");
  console.log('    Nach Klick auf 1h: ' + nach.zr + ', ' + nach.fest + ' Kerzen · ' + String(nach.quelle).slice(0, 120));
  if (nach.zr !== '1h') funde.push('Viewer: der Zeitrahmen-Knopf 1h hat den Zustand nicht umgestellt (' + nach.zr + ')');
  if (!String(nach.quelle).trim()) funde.push('Viewer: nach dem Wechsel ist die Fusszeile stumm');

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
  return funde;
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
