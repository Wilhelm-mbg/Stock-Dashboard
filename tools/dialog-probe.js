'use strict';
/* ================= DIALOG-PROBE: liegt oben, was oben liegen soll? =================
 *
 * Was diese Sonde misst, und warum es sie gibt.
 *
 * Die erste Fassung (27.08.2026) fragte die Fokusreihenfolge IN einem Dialog ab -
 * wandert der Fokus hinein, faengt sich Tab im Kreis, schliesst Escape, kommt der
 * Fokus zum Ausloeser zurueck. Sie hat damit einen ganzen Bereich abgedeckt, der
 * vorher nie gemessen war, und sie war gruen.
 *
 * Gruen war sie aus zwei Gruenden, und beide waren Fehler der Sonde:
 *
 *   1. Sie oeffnete IMMER NUR EINEN Dialog. Der Fehler der App sass aber genau
 *      zwischen zweien: alle sechs trugen dasselbe `z-index: 100`, also entschied
 *      die Reihenfolge im Markup, wer oben liegt. Der einzige Weg zu "Was ist neu"
 *      fuehrt durch die App-Einstellungen - und der zweite Dialog ging auf und blieb
 *      unsichtbar (QS-Fund B1 vom 04.09.2026). Eine Sonde, die Ketten nicht faehrt,
 *      kann diesen Fehler nicht sehen; sie sagt trotzdem "gruen".
 *   2. Ihre Pruefung "wandert der Fokus ueberhaupt in den Dialog?" stand in einem
 *      Kommentar, der nie geschlossen wurde. Der Kommentar frass die Zeile
 *      `if (!drin) befunde.push(...)` mit auf. Die Sonde NANNTE die Frage in ihrem
 *      Kopf, stellte sie aber nicht - und niemand sah es, weil das Ergebnis wie ein
 *      bestandener Test aussah.
 *
 * Diese Fassung misst deshalb drei Dinge, nicht eins:
 *
 *   TEIL A - jeden der sechs Dialoge einzeln: sichtbar obenauf, Fokus hinein, Fokus
 *            NICHT auf dem Schliessen-Kreuz, ein Name unter 120 Zeichen, Fokusfalle
 *            vor- und rueckwaerts, Escape schliesst, Fokus kehrt zum Ausloeser zurueck.
 *   TEIL B - die Kette, an der B1 haengt: Kopfzeile -> App-Einstellungen ->
 *            "Was ist neu anzeigen", mit ECHTEN Mausklicks. Der zweite Dialog muss
 *            sichtbar obenauf liegen, das erste Escape muss IHN schliessen und die
 *            Einstellungen stehen lassen, das zweite die Einstellungen - und der
 *            Fokus muss jedes Mal zu SEINEM Ausloeser zurueck.
 *   TEIL C - die Positivkontrolle: zwei Dialoge werden absichtlich mit gleicher Ebene
 *            geoeffnet, also genau in den Zustand versetzt, den B1 beschreibt. Die
 *            Sichtbarkeitsmessung MUSS dann rot werden. Wird sie es nicht, misst sie
 *            nicht, was sie behauptet, und die gruenen Zeilen von Teil A und B sind
 *            wertlos.
 *
 * ECHTE MAUSKLICKS, nicht element.click(). Ein Skript-Klick fokussiert den Knopf
 * nicht; `openModal` merkt sich dann als Rueckweg <body> statt des Knopfes, und die
 * Sonde meldet einen Fehler, den ein Mensch nie hat. Bei der QS am 04.09. ist so
 * beinahe ein Fehlbefund entstanden - deshalb faehrt Teil B ueber sendInputEvent.
 *
 * VOLLSTAENDIG ISOLIERT wie tools/ui-probe.js: frisches userData, frischer Datenordner
 * unter %TEMP%. Die Installation des Nutzers wird nie beruehrt. Gedrueckt wird nur,
 * was die Klick-Sperrliste in wiki/betrieb.md erlaubt: #settingsBtn und
 * #wasNeuZeigenBtn. #diagJa wird nie gedrueckt - Tab darf darauf stehen bleiben,
 * ausgeloest wird es nicht.
 *
 * Aufruf aus der Repo-Wurzel (ein Fenster erscheint kurz - das ist normal):
 *
 *   .\node_modules\.bin\electron.cmd tools\dialog-probe.js
 *
 * Exit 0: kein Befund. Exit 1: mindestens ein Befund. Exit 2: die Probe kam nicht
 * durch. Kein Teil von npm test - sie braucht ein Fenster und echte Zeit.
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-dialog-probe-'));
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

/* Alle sechs Dialoge. Die erste Fassung fuehrte fuenf - erststartModalBg fehlte, und
 * damit ausgerechnet der, den jeder Nutzer als ersten sieht. */
const DIALOGE = [
  { id: 'erststartModalBg', name: 'Kurz gesagt' },
  { id: 'wasNeuModalBg', name: 'Was ist neu' },
  { id: 'aiModalBg', name: 'Analyse' },
  { id: 'ticketModalBg', name: 'Trade nachbilden' },
  { id: 'setModalBg', name: 'App-Einstellungen' },
  { id: 'diagModalBg', name: 'Diagnose' }
];

/* Ab hier ist ein "Name" keiner mehr. Der Diagnose-Dialog liess aria-labelledby auf
 * 1.273 Zeichen Einwilligungstext zeigen (QS-Fund U2). Dieselbe Zahl steht in
 * app-shell.js - sie gehoert der Sache, nicht der Sonde. */
const NAME_MAX = 120;

/* Electron erwartet den NAMEN der Taste, nicht ihren Code - eine Zahl quittiert es
 * mit "Invalid event object". Beim ersten Wurf ist die Probe daran ins Zeitlimit
 * gelaufen, statt den Fehler zu zeigen; deshalb steht es hier. */
function taste(wc, name, mods) {
  wc.sendInputEvent({ type: 'keyDown', keyCode: name, modifiers: mods || [] });
  wc.sendInputEvent({ type: 'keyUp', keyCode: name, modifiers: mods || [] });
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/* Ein ECHTER Mausklick auf die Bildschirmposition eines Elements. element.click()
 * waere kuerzer und wuerde das Falsche messen: es fokussiert den Knopf nicht. */
async function klickAuf(wc, waehler) {
  const r = await wc.executeJavaScript(
    "(function () { var e = document.querySelector('" + waehler + "');" +
    " if (!e) return null; e.scrollIntoView({ block: 'center' });" +
    " var b = e.getBoundingClientRect();" +
    " if (!b.width && !b.height) return null;" +
    " return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; })()", true);
  if (!r) return null;
  wc.sendInputEvent({ type: 'mouseMove', x: r.x, y: r.y });
  wc.sendInputEvent({ type: 'mouseDown', x: r.x, y: r.y, button: 'left', clickCount: 1 });
  wc.sendInputEvent({ type: 'mouseUp', x: r.x, y: r.y, button: 'left', clickCount: 1 });
  return r;
}

/* Liegt der Dialog SICHTBAR obenauf? Gefragt wird nicht das Markup, sondern der
 * Bildschirm: was traefe ein Finger in der Mitte dieses Dialogfensters? Gibt
 * elementFromPoint einen ANDEREN Dialog zurueck, ist dieser hier verdeckt - genau
 * der Zustand von B1, in dem ein Knopfdruck sichtbar nichts bewirkt. */
function sichtbarCode(id) {
  return "(function () { var bg = document.getElementById('" + id + "');" +
    " if (!bg || !bg.classList.contains('open')) return { getroffen: 'NICHT OFFEN' };" +
    " var m = bg.querySelector('.modal') || bg;" +
    " var r = m.getBoundingClientRect();" +
    " var x = Math.min(Math.max(r.left + r.width / 2, 1), window.innerWidth - 2);" +
    " var y = Math.min(Math.max(r.top + r.height / 2, 1), window.innerHeight - 2);" +
    " var el = document.elementFromPoint(x, y);" +
    " var o = el && el.closest ? el.closest('.modal-bg') : null;" +
    " return { getroffen: o ? o.id : (el ? el.tagName : 'nichts')," +
    "          ebene: bg.style.zIndex || '(aus dem Stylesheet)' }; })()";
}

function aktivCode() {
  return "(function () { var a = document.activeElement;" +
    " return { tag: a ? a.tagName : '-', id: a ? a.id : ''," +
    "          txt: a ? (a.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 28) : ''," +
    "          kreuz: !!(a && a.classList && a.classList.contains('close')) }; })()";
}

/* --------------------------------------------------------------------------
 * TEIL A: jeder Dialog einzeln.
 * Der Ausloeser ist ein eigener Knopf, den die Sonde anlegt und FOKUSSIERT - erst
 * dadurch ist "der Fokus kehrt zum Ausloeser zurueck" ueberhaupt entscheidbar. Ohne
 * merkbaren Ausloeser saehe "nicht entscheidbar" wie "bestanden" aus. */
/* Welche Dialoge sind gerade offen? Die Antwort ist zweimal wichtig: als Messwert
 * und als Pruefung der Messung selbst. */
const OFFENE = "[].slice.call(document.querySelectorAll('.modal-bg.open')).map(function (b) { return b.id; })";

/* EIN Dialog, einmal gemessen. Gibt neben den Befunden zurueck, ob waehrend der
 * Messung ein FREMDER Dialog aufgegangen ist - die App tut das von selbst (die
 * Diagnose-Frage beim ersten Start, danach "Kurz gesagt" im Sekundentakt), und beim
 * zweiten Wurf hat genau das drei Befunde erzeugt, die keine waren: der Fremddialog
 * lag oben, also fing SEINE Fokusfalle die Tab-Taste und SEIN Escape schloss ihn.
 * Gemeldet wurde es dem Dialog, der gerade gemessen wurde.
 *
 * Eine gestoerte Messung ist nicht entscheidbar - und nicht entscheidbar darf weder
 * wie bestanden noch wie durchgefallen aussehen. Der Aufrufer wiederholt sie. */
async function messeDialog(win, d) {
  const wc = win.webContents;
  const js = (code) => wc.executeJavaScript(code, true);
  const befunde = [];
  {
    const da = await js("!!document.getElementById('" + d.id + "')");
    if (!da) return { befunde: [d.name + ': Dialog fehlt im Dokument'], zeile: null, fremd: null };

    await js(
      "(function () { var b = document.createElement('button');" +
      " b.id = '__probeAusloeser'; b.textContent = 'Probe';" +
      " document.body.appendChild(b); b.focus(); })()");
    if (await js("document.activeElement.id") !== '__probeAusloeser') {
      befunde.push(d.name + ': Der Probe-Ausloeser liess sich nicht fokussieren - Messung ungueltig');
      await js("(function(){var b=document.getElementById('__probeAusloeser'); if(b) b.remove();})()");
      return { befunde: befunde, zeile: null, fremd: null };
    }

    await js("window.openModal('" + d.id + "')");
    await pause(300);

    /* 1. sichtbar obenauf */
    const sicht = await js(sichtbarCode(d.id));
    if (sicht.getroffen !== d.id) {
      befunde.push(d.name + ': liegt nicht sichtbar obenauf - in seiner Mitte liegt "' +
        sicht.getroffen + '". Ein Klick darauf bewirkt fuer den Nutzer nichts');
    }

    /* 2. Fokus im Dialog - und nicht auf dem Kreuz.
     * Diese Zeile stand in der ersten Fassung im Kommentar und lief nie. */
    const drin = await js(
      "(function () { var bg = document.getElementById('" + d.id + "');" +
      " return !!(bg && bg.classList.contains('open') && bg.contains(document.activeElement)); })()");
    const aktiv = await js(aktivCode());
    if (!drin) {
      befunde.push(d.name + ': Der Fokus wandert beim Oeffnen NICHT in den Dialog (steht auf ' +
        aktiv.tag + '/' + aktiv.txt + ')');
    }
    if (aktiv.kreuz) {
      befunde.push(d.name + ': Der Fokus landet auf dem Schliessen-Kreuz - wer einen Dialog ' +
        'oeffnet, will ihn benutzen, nicht schliessen');
    }

    /* 3. Ein Name, den eine Vorlesehilfe ansagen kann - und der ein Name ist. */
    const name = await js(
      "(function () { var m = document.querySelector('#" + d.id + " [role=\"dialog\"]') ||" +
      " document.querySelector('#" + d.id + " .modal'); if (!m) return { art: 'kein Dialogkasten' };" +
      " var l = m.getAttribute('aria-labelledby');" +
      " if (l) { var z = document.getElementById(l);" +
      "   if (!z) return { art: 'leer', kennung: l };" +
      "   var t = (z.textContent || '').replace(/\\s+/g, ' ').trim();" +
      "   return { art: 'labelledby', kennung: l, laenge: t.length, anfang: t.slice(0, 40) }; }" +
      " var al = m.getAttribute('aria-label');" +
      " return al ? { art: 'label', laenge: al.length, anfang: al } : { art: 'keiner' }; })()");
    if (name.art === 'keiner' || name.art === 'kein Dialogkasten') {
      befunde.push(d.name + ': Der Dialog hat keinen Namen fuer die Vorlesehilfe');
    } else if (name.art === 'leer') {
      befunde.push(d.name + ': aria-labelledby zeigt auf "#' + name.kennung + '" - das es nicht gibt');
    } else if (!name.laenge) {
      befunde.push(d.name + ': Der Name ist leer (aria-labelledby zeigt auf einen leeren Kasten)');
    } else if (name.laenge > NAME_MAX) {
      befunde.push(d.name + ': Der Name ist ' + name.laenge + ' Zeichen lang (hoechstens ' + NAME_MAX +
        ') - eine Vorlesehilfe liest den ganzen Inhalt als Titel vor: "' + name.anfang + '…"');
    }

    /* 4. Fokusfalle vorwaerts und rueckwaerts. */
    const anzahl = await js(
      "(function () { var bg = document.getElementById('" + d.id + "');" +
      " var f = [].slice.call(bg.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=\"hidden\"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex=\"-1\"])'))" +
      "  .filter(function (e) { return e.offsetWidth || e.offsetHeight || e.getClientRects().length; });" +
      " if (f.length) f[f.length - 1].focus();" +
      " return f.length; })()");
    if (!anzahl) {
      befunde.push(d.name + ': Kein fokussierbares Element im Dialog - die Fokusfalle ist nicht pruefbar');
    } else {
      taste(wc, 'Tab');
      await pause(150);
      if (!await js("document.getElementById('" + d.id + "').contains(document.activeElement)")) {
        befunde.push(d.name + ': Tab am Ende faellt AUS dem Dialog heraus - keine Fokusfalle');
      }
      await js(
        "(function () { var bg = document.getElementById('" + d.id + "');" +
        " var f = [].slice.call(bg.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=\"hidden\"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex=\"-1\"])'))" +
        "  .filter(function (e) { return e.offsetWidth || e.offsetHeight || e.getClientRects().length; });" +
        " if (f.length) f[0].focus(); })()");
      taste(wc, 'Tab', ['shift']);
      await pause(150);
      if (!await js("document.getElementById('" + d.id + "').contains(document.activeElement)")) {
        befunde.push(d.name + ': Umschalt+Tab am Anfang faellt AUS dem Dialog heraus');
      }
    }

    /* Bevor Fokusfalle und Escape zu einem Urteil werden: liegt ueberhaupt noch
     * dieser Dialog oben? Ein fremder darueber macht beide Fragen unentscheidbar. */
    const offeneJetzt = await js(OFFENE);
    const fremd = offeneJetzt.filter(function (k) { return k !== d.id; });
    if (fremd.length) {
      await js("(function(){var b=document.getElementById('__probeAusloeser'); if(b) b.remove();})()");
      return { befunde: [], zeile: null, fremd: fremd.join(', ') };
    }

    /* 5. Escape schliesst, und der Fokus kehrt zum Ausloeser zurueck. */
    taste(wc, 'Escape');
    await pause(250);
    const zu = await js("!document.getElementById('" + d.id + "').classList.contains('open')");
    if (!zu) befunde.push(d.name + ': Escape schliesst den Dialog nicht');
    const zurueck = await js("document.activeElement.id");
    if (zu && zurueck !== '__probeAusloeser') {
      befunde.push(d.name + ': Nach dem Schliessen steht der Fokus auf "' + (zurueck || '(ohne Kennung)') +
        '" statt auf dem Ausloeser - man tabbt sich durch die ganze Seite zurueck');
    }

    const zeile = ('  ' + d.name.padEnd(18) +
      'obenauf ' + (sicht.getroffen === d.id ? 'ja ' : 'NEIN') +
      ' | Ebene ' + String(sicht.ebene).padStart(4) +
      ' | Fokus hinein ' + (drin ? 'ja ' : 'NEIN') +
      ' | Kreuz ' + (aktiv.kreuz ? 'JA ' : 'nein') +
      ' | Name ' + String(name.laenge === undefined ? '-' : name.laenge).padStart(4) +
      ' | Escape ' + (zu ? 'ja ' : 'NEIN') +
      ' | zurueck ' + (zurueck === '__probeAusloeser' ? 'ja ' : 'NEIN') +
      ' | erstes: ' + aktiv.tag + '/' + aktiv.txt);

    await js("(function(){var bg=document.getElementById('" + d.id + "'); if(bg){bg.classList.remove('open'); bg.style.zIndex='';}" +
      " var b=document.getElementById('__probeAusloeser'); if(b) b.remove();})()");
    await pause(120);
    return { befunde: befunde, zeile: zeile, fremd: null };
  }
}

async function teilA(win, befunde, zeilen) {
  for (const d of DIALOGE) {
    console.log('  ... A ' + d.name);
    let erg = await messeDialog(win, d);
    if (erg.fremd) {
      /* Einmal wiederholen, nachdem die Buehne wieder frei ist. Der Nachzuegler
       * kommt nur einmal je frischem Profil - beim zweiten Anlauf ist er weg. */
      console.log('      (gestoert durch ' + erg.fremd + ' - Wiederholung)');
      await aufraeumen(win.webContents);
      erg = await messeDialog(win, d);
    }
    if (erg.fremd) {
      befunde.push(d.name + ': Waehrend der Messung ging zweimal ein fremder Dialog auf (' + erg.fremd +
        ') - dieser Dialog ist NICHT gemessen');
      zeilen.push('  ' + d.name.padEnd(18) + 'nicht entscheidbar - fremder Dialog dazwischen: ' + erg.fremd);
      continue;
    }
    erg.befunde.forEach(function (b) { befunde.push(b); });
    if (erg.zeile) zeilen.push(erg.zeile);
  }
}

/* --------------------------------------------------------------------------
 * TEIL B: die Kette, an der B1 haengt. Echte Mausklicks. */
async function teilB(win, befunde, zeilen) {
  const wc = win.webContents;
  const js = (code) => wc.executeJavaScript(code, true);
  console.log('  ... B Kette Einstellungen -> Was ist neu');

  await js("window.scrollTo(0, 0)");
  await pause(150);
  if (!await klickAuf(wc, '#settingsBtn')) {
    befunde.push('Kette: #settingsBtn war nicht anklickbar - die Kette ist nicht gemessen');
    return;
  }
  await pause(500);
  if (!await js("document.getElementById('setModalBg').classList.contains('open')")) {
    befunde.push('Kette: Ein Klick auf "App-Einstellungen" oeffnet den Dialog nicht');
    return;
  }
  const her1 = await js("document.activeElement.id");

  if (!await klickAuf(wc, '#wasNeuZeigenBtn')) {
    befunde.push('Kette: #wasNeuZeigenBtn war nicht anklickbar - die Kette ist nicht gemessen');
    return;
  }
  /* wasneu.js fragt den Update-Stand ab, bevor es zeigt - das ist ein Versprechen. */
  await pause(1500);

  const beide = await js(
    "({ set: document.getElementById('setModalBg').classList.contains('open')," +
    "   wasNeu: document.getElementById('wasNeuModalBg').classList.contains('open') })");
  if (!beide.wasNeu) {
    befunde.push('Kette: Ein Klick auf "Was ist neu anzeigen" oeffnet den zweiten Dialog nicht');
    return;
  }
  const sicht = await js(sichtbarCode('wasNeuModalBg'));
  if (sicht.getroffen !== 'wasNeuModalBg') {
    befunde.push('Kette (B1): Der zweite Dialog ist offen, aber VERDECKT - in seiner Mitte liegt "' +
      sicht.getroffen + '". Der Knopfdruck bewirkt fuer den Nutzer sichtbar nichts');
  }
  const aktiv2 = await js(aktivCode());
  if (!await js("document.getElementById('wasNeuModalBg').contains(document.activeElement)")) {
    befunde.push('Kette: Der Fokus bleibt nach dem Oeffnen im ERSTEN Dialog (' + aktiv2.tag + '/' + aktiv2.txt + ')');
  }

  /* Erstes Escape: es gehoert dem OBERSTEN. Vorher nahm der Handler den ersten
   * .modal-bg.open in Dokumentreihenfolge und schloss damit den unsichtbaren. */
  taste(wc, 'Escape');
  await pause(300);
  const nach1 = await js(
    "({ set: document.getElementById('setModalBg').classList.contains('open')," +
    "   wasNeu: document.getElementById('wasNeuModalBg').classList.contains('open')," +
    "   fokus: document.activeElement.id })");
  if (nach1.wasNeu) befunde.push('Kette: Das erste Escape schliesst den obersten Dialog nicht');
  if (!nach1.set) befunde.push('Kette: Das erste Escape schliesst BEIDE Dialoge - der untere war noch gebraucht');
  if (nach1.fokus !== 'wasNeuZeigenBtn') {
    befunde.push('Kette: Nach dem ersten Escape steht der Fokus auf "' + (nach1.fokus || '(ohne Kennung)') +
      '" statt auf "wasNeuZeigenBtn"');
  }

  taste(wc, 'Escape');
  await pause(300);
  const nach2 = await js(
    "({ set: document.getElementById('setModalBg').classList.contains('open')," +
    "   fokus: document.activeElement.id })");
  if (nach2.set) befunde.push('Kette: Das zweite Escape schliesst die Einstellungen nicht');
  /* Der Kern des zweiten Teils von B1: der globale Merker war beim ersten Schliessen
   * geleert worden, der Fokus landete auf <body>. */
  if (nach2.fokus !== 'settingsBtn') {
    befunde.push('Kette (B1): Nach dem zweiten Escape steht der Fokus auf "' + (nach2.fokus || '<body>') +
      '" statt auf "settingsBtn" - jeder Dialog braucht seinen EIGENEN Rueckweg');
  }

  zeilen.push('  Kette              obenauf ' + (sicht.getroffen === 'wasNeuModalBg' ? 'ja ' : 'NEIN') +
    ' | Ebene ' + String(sicht.ebene).padStart(4) +
    ' | 1. Escape: wasNeu ' + (nach1.wasNeu ? 'OFFEN' : 'zu') + ', set ' + (nach1.set ? 'offen' : 'ZU') +
    ', Fokus ' + (nach1.fokus || '<body>') +
    ' | 2. Escape: Fokus ' + (nach2.fokus || '<body>') +
    ' | Ausloeser 1 war ' + (her1 || '<body>'));

  await js("['setModalBg','wasNeuModalBg'].forEach(function(k){var b=document.getElementById(k); if(b){b.classList.remove('open'); b.style.zIndex='';}})");
  await pause(120);
}

/* --------------------------------------------------------------------------
 * TEIL C: Positivkontrolle. Zwei Dialoge werden an der Verwaltung VORBEI geoeffnet
 * und tragen dadurch beide nur die Ebene aus dem Stylesheet - der Gleichstand, aus
 * dem B1 entstand. Die Sichtbarkeitsmessung MUSS das sehen. Sieht sie es nicht, misst
 * sie nicht, was sie behauptet, und alles darueber ist wertlos. */
async function teilC(win, befunde, zeilen) {
  const js = (code) => win.webContents.executeJavaScript(code, true);
  console.log('  ... C Positivkontrolle');

  await js("['setModalBg','wasNeuModalBg'].forEach(function(k){var b=document.getElementById(k);" +
    " b.classList.add('open'); b.style.zIndex='';})");
  await pause(200);
  const sicht = await js(sichtbarCode('wasNeuModalBg'));
  /* wasNeuModalBg steht im Markup VOR setModalBg. Bei Gleichstand liegt deshalb
   * setModalBg oben, und die Messung muss "verdeckt" melden. */
  const erkannt = sicht.getroffen !== 'wasNeuModalBg';
  if (!erkannt) {
    befunde.push('POSITIVKONTROLLE GESCHEITERT: zwei Dialoge mit gleicher Ebene, und die Messung ' +
      'meldet den zuletzt geoeffneten trotzdem als obenauf. Die Sichtbarkeitsmessung dieser Sonde ' +
      'misst nicht, was sie behauptet - jede gruene Zeile darueber ist wertlos');
  }
  zeilen.push('  Positivkontrolle   gleiche Ebene -> verdeckt erkannt: ' + (erkannt ? 'ja' : 'NEIN') +
    ' (getroffen: ' + sicht.getroffen + ')');

  await js("['setModalBg','wasNeuModalBg'].forEach(function(k){var b=document.getElementById(k);" +
    " b.classList.remove('open'); b.style.zIndex='';})");
  await pause(120);
}

/* Buehne frei. Die App macht von selbst Dialoge auf: die Diagnose-Frage beim ersten
 * Start, und erststart.js wartet in einem Takt darauf, dass die weg ist, um SEINEN
 * Dialog zu zeigen. Beim ersten Wurf dieser Fassung ist genau das passiert - "Kurz
 * gesagt" ging mitten in Teil A wieder auf und lag in Teil B ueber dem Knopf
 * #settingsBtn, der Klick traf den Rand des fremden Dialogs, und die Sonde meldete
 * "der Klick oeffnet den Dialog nicht". Ein Messfehler, der aussah wie ein Befund.
 *
 * Geschlossen wird mit Escape, also ueber den Weg der App selbst: `open` von aussen
 * wegzunehmen liesse den Dialog im Stapel stehen. Beantwortet wird nichts - #diagJa
 * bleibt ungedrueckt, unentschieden heisst weiterhin "es wird nichts gesendet". */
async function aufraeumen(wc) {
  const offen = () => wc.executeJavaScript("!!document.querySelector('.modal-bg.open')", true);
  /* Vier Runden mit Wartezeit dazwischen, nicht ein Durchgang: erststart.js prueft im
   * SEKUNDENTAKT, ob die Diagnose-Frage weg ist, und macht erst danach auf. Ein
   * einzelner Durchgang raeumt also die Diagnose weg und ist fertig, bevor der
   * Nachzuegler ueberhaupt kommt - er kam beim zweiten Wurf mitten in die Messung von
   * "Analyse" und verschob dort den Fokus. Auch das sah aus wie ein Befund. */
  for (let runde = 0; runde < 4; runde++) {
    for (let i = 0; i < 8 && await offen(); i++) { taste(wc, 'Escape'); await pause(220); }
    if (await offen()) continue;
    await pause(1400);
    if (!await offen()) return true;
  }
  return !await offen();
}

async function probe(win, opt) {
  opt = opt || {};
  const befunde = [];
  const zeilen = ['Bewegung: ' + (opt.reduziert ? 'REDUZIERT (wie bei Wilhelm)' : 'normal')];
  if (!await aufraeumen(win.webContents)) befunde.push('Vor Teil A blieb ein Dialog offen - die Buehne war nicht frei');
  await teilA(win, befunde, zeilen);
  if (!await aufraeumen(win.webContents)) befunde.push('Vor Teil B blieb ein Dialog offen - die Kette waere nicht messbar');
  await teilB(win, befunde, zeilen);
  await teilC(win, befunde, zeilen);
  const seitenFehler = await win.webContents.executeJavaScript('(window.__probeFehler || []).slice(0, 10)', true);
  return { befunde, zeilen, seitenFehler: seitenFehler || [] };
}

setTimeout(() => { console.error('Dialog-Probe: Zeitlimit (300 s).'); app.exit(2); }, 300000);

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  win.webContents.once('did-finish-load', async () => {
    try {
      await new Promise((r) => setTimeout(r, 4000));
      await win.webContents.executeJavaScript(
        "window.__probeFehler = [];" +
        "window.addEventListener('error', function (e) { window.__probeFehler.push(String(e.message || e)); });" +
        "'bereit'", true);

      /* WILHELMS RECHNER HAT prefers-reduced-motion AKTIV - das ist bei ihm der
       * Normalfall, nicht der Sonderfall. Der erste Wurf dieser Sonde hat "aus"
       * gemessen und damit die Bedingung, unter der er die App NIE sieht. Deshalb
       * wird der Zustand emuliert und in BEIDEN Zustaenden gemessen: ohne Bewegung
       * koennen Elemente beim Fokussieren schon liegen, mit Bewegung noch nicht -
       * und die Fokusfalle filtert nach Groesse. */
      const dbg = win.webContents.debugger;
      async function medien(reduziert) {
        try {
          if (!dbg.isAttached()) dbg.attach();
          await dbg.sendCommand('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: reduziert ? 'reduce' : 'no-preference' }] });
          return true;
        } catch (e) { return false; }
      }
      const konnte = await medien(true);
      const erg = await probe(win, { reduziert: konnte });
      if (!konnte) erg.befunde.push('Die Bewegungs-Einstellung liess sich nicht emulieren - gemessen wurde nur ein Zustand');
      if (konnte) {
        await medien(false);
        const erg2 = await probe(win, { reduziert: false });
        erg2.befunde.forEach(function (b) { if (erg.befunde.indexOf(b) === -1) erg.befunde.push(b + ' (nur ohne Bewegungsreduktion)'); });
        erg.zeilen = erg.zeilen.concat([''], erg2.zeilen);
      }
      console.log('Dialog-Probe: Stapel, Sichtbarkeit, Fokus\n');
      erg.zeilen.forEach((z) => console.log(z));
      if (erg.seitenFehler.length) {
        console.log('\nSeitenfehler waehrend der Probe:');
        erg.seitenFehler.forEach((f) => console.log('  ' + f));
      }
      if (erg.befunde.length) {
        console.log('\n' + erg.befunde.length + ' BEFUND(E):');
        erg.befunde.forEach((b) => console.log('  - ' + b));
        app.exit(1);
      } else {
        console.log('\nDialog-Probe gruen: jeder Dialog liegt sichtbar obenauf, der Fokus wandert hinein ' +
          'und nicht aufs Kreuz, Escape schliesst den obersten, und jeder Dialog kennt seinen eigenen Rueckweg.');
        app.exit(0);
      }
    } catch (e) {
      console.error('Dialog-Probe kaputt: ' + (e && e.stack || e));
      app.exit(2);
    }
  });
});

/* Ohne diese Zeile startet die App gar nicht - es wird kein Fenster erzeugt, der
 * Zuhoerer oben feuert nie, und die Probe laeuft stumm ins Zeitlimit. Genau das ist
 * beim ersten Wurf passiert: ein Zeitlimit sieht aus wie ein Haenger, war aber ein
 * fehlender Start. */
app.whenReady().then(() => { require(path.join(WURZEL, 'main.js')); });
