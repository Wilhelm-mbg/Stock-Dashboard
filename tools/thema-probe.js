'use strict';
/* ================= Thema-Probe: blitzt der Start? =================
 *
 * Stufe F Punkt 1 (26.08.2026). Die Frage "sieht der Anwender beim Start kurz das
 * falsche Farbthema?" laesst sich im Quelltext NICHT beantworten. Man kann dort
 * nachlesen, dass ein Skript im <head> steht - ob das frueh genug greift, sagt nur
 * ein echter Start mit echten Bildern.
 *
 * Die Probe startet die App vollstaendig isoliert (frisches userData unter %TEMP%,
 * der Speicher des Nutzers wird nie beruehrt), traegt vorher HELL in den Speicher
 * ein und fotografiert das Fenster ab dem ersten Aufbau im Takt von 20 ms. Fuer
 * jedes Bild wird der Anteil DUNKLER Bildpunkte gezaehlt.
 *
 * Erwartung bei eingestelltem Hell-Thema: kein einziges Bild ist ueberwiegend
 * dunkel. Ein Bild mit dunkler Mehrheit IST der Blitz.
 *
 * Die Probe beisst nachweislich (A/B am 26.08.2026, je 6 Sekunden):
 *   beide Reparaturen        ->   0 von 206 Bildern dunkel
 *   ohne thema.js            ->   7 von 210 dunkel (die Seite malt dunkel, bis die
 *                                 IPC-Antwort da ist - rund eine Fuenftelsekunde)
 *   dazu Fensterfarbe fest   ->   9 von 9 dunkel bei 2,5 s Beobachtung: das Fenster
 *     auf dunkel                  steht dunkel, bevor die Seite ueberhaupt malt
 * Es sind also ZWEI Ursachen, und beide muessen behoben bleiben.
 *
 * Aufruf aus der Repo-Wurzel (ein Fenster erscheint kurz - das ist normal):
 *
 *   .\node_modules\.bin\electron.cmd tools\thema-probe.js
 *
 * Exit-Code 0: kein dunkles Bild, und das Thema stand schon vor dem ersten Bild.
 * Exit-Code 1: Blitz gemessen. Exit-Code 2: die Probe kam nicht durch.
 *
 * Kein Teil von npm test - sie braucht ein Fenster und einige Sekunden. Sie gehoert
 * vor und nach jede Aenderung am Startweg des Themas.
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-thema-probe-'));
app.setPath('userData', path.join(TESTROOT, 'userdata'));
app.setPath('downloads', path.join(TESTROOT, 'downloads'));

/* HELL in den frischen Speicher legen - genau dort, wo main.js und store-get lesen.
 * Ohne diesen Eintrag waere die Probe wertlos: dunkel ist die Vorgabe, und dann
 * blitzt naturgemaess nichts. */
const STORE = path.join(TESTROOT, 'userdata', 'store');
fs.mkdirSync(STORE, { recursive: true });
fs.writeFileSync(path.join(STORE, 'theme.json'), JSON.stringify('light'), 'utf8');

app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

const origLoadFile = BrowserWindow.prototype.loadFile;
BrowserWindow.prototype.loadFile = function (fp, opts) {
  if (!path.isAbsolute(fp)) fp = path.join(WURZEL, fp);
  return origLoadFile.call(this, fp, opts);
};

/* Anteil dunkler Bildpunkte eines Fotos. Das Bild wird klein gerechnet - es geht um
 * die Grundfarbe der Flaeche, nicht um Schrift. toBitmap liefert BGRA. */
function anteilDunkel(bild) {
  if (!bild || bild.isEmpty()) return null;
  const klein = bild.resize({ width: 48, quality: 'good' });
  const b = klein.toBitmap();
  const groesse = klein.getSize();
  let dunkel = 0, n = 0;
  for (let i = 0; i + 3 < b.length; i += 4) {
    /* Wahrnehmungsnahe Helligkeit, sonst zaehlt ein saettigendes Blau als hell. */
    const lum = (0.114 * b[i] + 0.587 * b[i + 1] + 0.299 * b[i + 2]) / 255;
    if (lum < 0.4) dunkel++;
    n++;
  }
  return n ? { anteil: dunkel / n, punkte: n, breite: groesse.width } : null;
}

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  const bilder = [];
  let laeuft = true;

  /* Ab dem ersten Aufbau fotografieren, nicht erst wenn die Seite fertig ist: der
   * Blitz waere sonst laengst vorbei. */
  const takt = setInterval(async () => {
    if (!laeuft || win.isDestroyed()) return;
    try {
      const f = anteilDunkel(await win.capturePage());
      if (f) bilder.push(f.anteil);
    } catch (e) { /* ein einzelnes misslungenes Foto ist kein Befund */ }
  }, 20);

  win.webContents.once('dom-ready', async () => {
    try {
      /* ACHTUNG, das hier ist KEIN Beweis - gemessen am 26.08.2026:
       * data-theme steht bei dom-ready AUCH DANN auf "light", wenn thema.js fehlt.
       * Der Nachlade-Weg ueber IPC ist schneller, als die dom-ready-Meldung beim
       * Hauptprozess ankommt - er ist nur nicht schneller als das erste Bild.
       * Diese beiden Zeilen sind deshalb reine Zustandskontrolle (kam das Argument
       * an? steht am Ende das richtige Thema?). Was den Blitz belegt, sind die
       * BILDER weiter unten, und nur die. */
      const fruehThema = await win.webContents.executeJavaScript(
        "document.documentElement.getAttribute('data-theme')", true);
      const uebergeben = await win.webContents.executeJavaScript(
        'window.api && window.api.startThema', true);
      setTimeout(() => {
        laeuft = false;
        clearInterval(takt);
        const spaetThema = win.isDestroyed() ? null : 'egal';
        const dunkleBilder = bilder.filter((a) => a > 0.5);
        console.log('Thema-Probe: Speicher steht auf HELL.');
        console.log('  an den Renderer uebergeben : ' + JSON.stringify(uebergeben));
        console.log('  data-theme bei dom-ready   : ' + JSON.stringify(fruehThema));
        console.log('  Bilder aufgenommen         : ' + bilder.length);
        console.log('  davon ueberwiegend dunkel  : ' + dunkleBilder.length);
        if (bilder.length) {
          console.log('  Anteil dunkler Punkte je Bild (erste 24): ' +
            bilder.slice(0, 24).map((a) => a.toFixed(2)).join(' '));
        }
        const befunde = [];
        if (bilder.length < 3) befunde.push('zu wenige Bilder (' + bilder.length + ') - die Probe hat nicht gemessen');
        if (dunkleBilder.length) befunde.push(dunkleBilder.length + ' Bild(er) ueberwiegend dunkel bei eingestelltem Hell-Thema - das IST der Blitz');
        if (fruehThema !== 'light') befunde.push('data-theme stand bei dom-ready auf ' + JSON.stringify(fruehThema) + ', nicht auf "light"');
        if (uebergeben !== 'light') befunde.push('window.api.startThema war ' + JSON.stringify(uebergeben) + ' - das Startargument kam nicht an');
        befunde.forEach((b) => console.error('BEFUND: ' + b));
        console.log(befunde.length ? 'Thema-Probe ROT: ' + befunde.length + ' Befund(e).' : 'Thema-Probe gruen: kein Blitz.');
        void spaetThema;
        app.exit(befunde.length ? 1 : 0);
      }, 6000);
    } catch (e) {
      clearInterval(takt);
      console.error('Thema-Probe abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

setTimeout(() => { console.error('Thema-Probe: Zeitlimit.'); app.exit(2); }, 60000);

require(path.join(WURZEL, 'main.js'));
