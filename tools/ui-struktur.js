'use strict';
/* ================= UI-Struktur: das Inventar der LAUFENDEN Oberflaeche =================
 *
 * Erzeugt wiki/aufnahmen/struktur.md samt Bildern - in EINEM Lauf, aus EINER
 * isolierten Kunstdaten-Instanz.
 *
 * WARUM NICHT AUS index.html. Die Fassung vom 04.09.2026 war aus dem Markup erzeugt.
 * Die QS hat daran neun Abweichungen gefunden (uebergabe/ui-qs-2026-09-04.md,
 * Abschnitt 1, S1-S9), und sechs davon haben dieselbe Ursache: Was erst der Renderer
 * schreibt, steht nicht im Markup. Es fehlten die drei Belegstand-Gruppen der
 * Regeln-Seite (strategien.js gruppenKopf), die fuenf Hotlist-Ueberschriften
 * (marktui.js liste), die drei H2 des Radars und die Statuszeilen in den Klappen.
 * Zwei weitere kamen daher, dass eine Textsuche keine Schachtelung kennt: der Baum
 * zeigte fuenfzehn Klappen des Maschinenraums auf einer Ebene, obwohl drei davon IN
 * anderen liegen, und er lief ueber das letzte Panel hinaus in die Modaldialoge.
 *
 * Diese Sonde liest statt dessen den DOM der laufenden Instanz. Sie sieht damit
 * alles, was der Renderer geschrieben hat, kennt die Schachtelung aus der
 * Vorfahrenkette und hoert am letzten Panel auf - die Dialoge bekommen einen eigenen
 * Abschnitt, weil sie zu keinem Reiter gehoeren.
 *
 * Aufruf aus der Repo-Wurzel (ein Fenster erscheint fuer einige Minuten - normal):
 *
 *   .\node_modules\.bin\electron.cmd tools\ui-struktur.js
 *   .\node_modules\.bin\electron.cmd tools\ui-struktur.js --ziel ..\probe --breite 1024
 *   .\node_modules\.bin\electron.cmd tools\ui-struktur.js --ohne-bilder
 *
 * Das Ziel ist FEST wiki/aufnahmen/ - ein Aufruf, ein fertiger Ordner. --ziel ist
 * fuer Proben da (dann wird das Wiki nicht angefasst), --ohne-bilder fuer einen
 * schnellen Blick nur auf das Inventar.
 *
 * Die Instanz ist vollstaendig isoliert: frisches userData und ein frischer
 * Datenordner unter %TEMP%, gefuellt aus tools/kunstinstanz.js - derselbe Zustand,
 * den tools/ui-aufnahmen.js fotografiert. Store, Depot und Downloads des Nutzers
 * werden nie beruehrt, kein Knopf der Sperrliste (wiki/betrieb.md) wird gedrueckt:
 * geklickt werden nur Reiter und Pillen, aufgeklappt werden nur <details>.
 *
 * Kein Teil von npm test - die Sonde braucht ein Fenster und mehrere Minuten. Sie
 * gehoert nach jeden Umbau der Oberflaeche (wiki/oberflaeche.md §7). */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..');

function schalter(name, vorgabe) {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('-') ? process.argv[i + 1] : vorgabe;
}
const ZIEL = path.resolve(schalter('--ziel', path.join(WURZEL, 'wiki', 'aufnahmen')));
const OHNE_BILDER = process.argv.indexOf('--ohne-bilder') > -1;
const BREITE = (function () {
  const n = parseInt(schalter('--breite', ''), 10);
  return isFinite(n) && n >= 320 && n <= 3840 ? n : 1280;
})();
const HOEHE = 820;
const MAX_SEITEN = 14;  /* Deckel wie in ui-aufnahmen.js: eine sehr lange Seite soll
                         * die Sonde nicht sprengen. 14 reicht fuer den
                         * aufgeklappten Maschinenraum. */

const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-ui-struktur-'));
app.setPath('userData', path.join(TESTROOT, 'userdata'));
app.setPath('downloads', path.join(TESTROOT, 'downloads'));
require(path.join(__dirname, 'kunstinstanz.js')).saeen(TESTROOT);

/* Ohne diese Schalter pausiert Chromium verdeckte Fenster - eine pausierte Seite
 * liefert leere Aufnahmen. */
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

const schlaf = (ms) => new Promise((r) => setTimeout(r, ms));

/* Der Ordnername je Reiter kommt aus dem BESCHRIFTUNGSTEXT, nicht aus data-tab:
 * data-tab heisst "dashboard" und "strategien", die Ordner heissen seit dem
 * 04.09. "heute" und "regeln". Wer den Reiter umbenennt, benennt damit den Ordner
 * mit - und muss nicht daran denken, eine Tabelle nachzuziehen. */
function slug(s) {
  return String(s).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/* ---------------------------------------------------------------------------
 * DER MESSCODE. Er laeuft IN der Seite und steht als Zeichenkette hier - dieselbe
 * Bauart wie ui-probe.js und a11y-probe.js, damit die Sonde ohne Aufbauschritt
 * auskommt.
 *
 * Gelesen wird in Dokumentreihenfolge, was ein Leser als Block wahrnimmt:
 * Ueberschriften (h2/h3) und Klappen (<details>). Die TIEFE ist die Zahl der
 * <details>-Vorfahren bis zum Panel - daran haengt die Einrueckung, und genau die
 * hat der Markup-Sicht gefehlt (S8).
 *
 * VERBORGEN wird getrennt gemeldet: ein Block mit [hidden] oder display:none steht
 * im Markup, aber der Leser sieht ihn nicht, bevor etwas passiert ist (Explorer
 * "Kennzahlen" erscheint erst nach dem Oeffnen eines Werts, S6). "Zugeklappt" ist
 * KEIN Verborgen-Grund - das sagt schon die Einrueckung; deshalb wird das Inventar
 * mit allen Klappen OFFEN gelesen. */
const MESSCODE = `(function (panelSel) {
  var wurzel = document.querySelector(panelSel);
  if (!wurzel) return JSON.stringify({ fehlt: panelSel });

  /* Warum der Leser den Block nicht sieht. Zugeklappte <details> zaehlen hier NICHT:
   * Chromium loest sie je nach Fassung ueber display:none oder ueber
   * content-visibility, und beides wuerde jeden Block einer Klappe faelschlich als
   * "verborgen" ausweisen. Die Klappe steht als Einrueckung im Baum. */
  function verborgenGrund(e) {
    var n = e;
    while (n && n !== wurzel.parentElement) {
      if (n.nodeType === 1) {
        if (n.hasAttribute('hidden')) return 'hidden';
        if (n.tagName !== 'DETAILS' || n.open) {
          var st = getComputedStyle(n);
          if (st.display === 'none') return 'ausgeblendet';
          if (st.visibility === 'hidden') return 'unsichtbar';
        }
      }
      n = n.parentElement;
    }
    return '';
  }
  /* Die Kennung des Blocks: die eigene, sonst die des naechsten Vorfahren, der eine
   * traegt. Das Panel selbst zaehlt nicht - es steht schon in der Ueberschrift. */
  function kennung(e) {
    var n = e, eigen = true;
    while (n && n !== wurzel) {
      if (n.id) return { id: n.id, eigen: eigen };
      eigen = false;
      n = n.parentElement;
    }
    return { id: '', eigen: false };
  }
  /* textContent, NICHT innerText: innerText liefert die Schrift so, wie CSS sie
   * gerade setzt - text-transform: uppercase macht aus jeder h2 eine Zeile in
   * Grossbuchstaben, und die stuende dann so im Inventar, als hiesse der Block
   * wirklich MARKTUEBERBLICK. Ob ein Block SICHTBAR ist, entscheidet ohnehin
   * verborgenGrund(), nicht die Wahl der Text-Eigenschaft.
   * Weg muessen die Info-Knoepfe (button.info traegt das i) und die Statuszeile -
   * beides sind eigene Bedienelemente, keine Bestandteile der Ueberschrift. */
  function text(e) {
    var k = e.cloneNode(true);
    Array.prototype.forEach.call(k.querySelectorAll('button, .klappe-stand'), function (x) { x.remove(); });
    return (k.textContent || '').replace(/\\s+/g, ' ').trim();
  }

  var eintraege = [];
  var alle = wurzel.querySelectorAll('h2, h3, details');
  Array.prototype.forEach.call(alle, function (e) {
    var istKlappe = e.tagName === 'DETAILS';
    /* Ueberschriften IN einem <summary> sind der Titel der Klappe, kein zweiter
     * Block - sie wuerden jede Klappe doppelt auffuehren. */
    if (!istKlappe && e.closest('summary')) return;
    /* Tiefe: wie viele Klappen liegen darueber? Bei der Klappe selbst zaehlt sie
     * nicht mit, sonst stuende jede Klappe eine Stufe unter ihrem eigenen Inhalt. */
    var tiefe = 0, p = e.parentElement;
    while (p && p !== wurzel) { if (p.tagName === 'DETAILS') tiefe++; p = p.parentElement; }

    var titel, stand = '';
    if (istKlappe) {
      var s = e.querySelector(':scope > summary');
      if (!s) return;
      /* Die Statuszeile steht als eigener Span im summary (app-shell.js
       * klappenStandSetzen). Sie gehoert nicht in den Titel - aber sie gehoert ins
       * Inventar, denn sie ist das, was der Leser ueber die zugeklappte Klappe
       * erfaehrt (QS Abschnitt 3). */
      var st2 = s.querySelector('.klappe-stand');
      stand = st2 ? (st2.textContent || '').replace(/\\s+/g, ' ').trim() : '';
      titel = text(s);
    } else {
      titel = text(e);
    }
    if (!titel) return;
    var k = kennung(e);
    eintraege.push({ art: istKlappe ? 'klappe' : e.tagName.toLowerCase(),
                     tiefe: tiefe, titel: titel, stand: stand,
                     kennung: k.id, eigeneKennung: k.eigen, verborgen: verborgenGrund(e) });
  });
  return JSON.stringify({ eintraege: eintraege, zeichen: (wurzel.innerText || '').replace(/\\s+/g, ' ').trim().length });
})`;

/* Die Dialoge. Sie gehoeren zu KEINEM Reiter - genau das war S7: der alte Erzeuger
 * lief ueber das Ende des letzten Panels hinaus und schlug die fuenf Dialoge dem
 * Maschinenraum zu. Gelesen wird der Titel dort, wo ihn auch ein Screenreader
 * findet: an aria-labelledby. Geoeffnet wird keiner. */
const DIALOGCODE = `(function () {
  var out = [];
  Array.prototype.forEach.call(document.querySelectorAll('.modal-bg'), function (m) {
    var d = m.querySelector('[role="dialog"]');
    var lb = d && d.getAttribute('aria-labelledby');
    var t = lb ? document.getElementById(lb) : null;
    var titel = t ? (t.textContent || '').replace(/\\s+/g, ' ').trim() : '';
    if (!titel) {
      var h = m.querySelector('h1, h2, h3');
      titel = h ? (h.textContent || '').replace(/\\s+/g, ' ').trim() : '';
    }
    /* Nicht jeder Dialog hat eine Ueberschrift: der Diagnose-Dialog laesst
     * aria-labelledby auf seinen ganzen Einwilligungstext zeigen. Der ist als
     * Beschriftung richtig und als Titel unbrauchbar - hier wird er gedeckelt und
     * die Kuerzung ausgewiesen, nicht stillschweigend abgeschnitten. */
    var lang = titel.length;
    if (lang > 80) titel = titel.slice(0, 80).replace(/\\s+\\S*$/, '') + ' …';
    out.push({ kennung: m.id, titel: titel, gekuerztVon: lang > 80 ? lang : 0,
               titelKennung: lb || '', offen: m.classList.contains('open') });
  });
  return JSON.stringify(out);
})()`;

/* ---------------------------------------------------------------------------
 * Aufnahmen. Gleiche Mechanik wie ui-aufnahmen.js, aber das Ziel ist der
 * Reiter-Unterordner und der Name die Pille - damit die Struktur auch im Datei-Baum
 * steht und die Seite ihre Bilder ohne Umsortieren findet. */
async function aufnehmen(win, ordner, name) {
  if (OHNE_BILDER) return [];
  const wc = win.webContents;
  const js = (code) => wc.executeJavaScript(code, true);
  const hoehe = await js('Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)');
  const seiten = Math.max(1, Math.min(MAX_SEITEN, Math.ceil(hoehe / HOEHE)));
  const dateien = [];
  fs.mkdirSync(ordner, { recursive: true });
  for (let i = 0; i < seiten; i++) {
    await js('window.scrollTo(0, ' + (i * HOEHE) + '); 0');
    await schlaf(400);
    const bild = await wc.capturePage();
    const datei = name + '-' + (i + 1) + '.png';
    fs.writeFileSync(path.join(ordner, datei), bild.toPNG());
    dateien.push(datei);
    console.log('  ' + datei + ' (' + bild.getSize().width + 'x' + bild.getSize().height + ')');
  }
  await js('window.scrollTo(0, 0); 0');
  return dateien;
}

async function lauf(win) {
  const wc = win.webContents;
  const js = (code) => wc.executeJavaScript(code, true);
  win.setContentSize(BREITE, HOEHE);
  await schlaf(700);
  /* Diagnose-Frage und Erststart-Banner wegklicken - sonst liegt ueber jeder
   * Aufnahme derselbe Kasten. Die Reihenfolge ist NICHT beliebig: erststart.js
   * oeffnet sein Fenster erst, wenn der Diagnose-Dialog zu ist, und pollt dafuer im
   * Sekundentakt (siehe ui-aufnahmen.js). Also klicken, dann warten, bis kein
   * Dialog mehr offen ist. */
  await js("(function () { var b = document.getElementById('diagNein'); if (b) b.click(); return 'ok'; })()");
  for (let i = 0; i < 30; i++) {
    await schlaf(700);
    const offen = await js("(function () {" +
      "var o = document.querySelector('.modal-bg.open'); if (!o) return '';" +
      "var k = o.querySelector('#erststartOk, #diagNein, [data-close=\"' + o.id + '\"]');" +
      "if (k) k.click(); return o.id; })()");
    if (!offen) break;
  }
  await schlaf(800);

  const reiter = await js("Array.prototype.map.call(document.querySelectorAll('nav.tabs button[data-tab]'), function (b) {" +
    "return { tab: b.getAttribute('data-tab'), name: (b.textContent || '').trim() }; })");
  if (!reiter || !reiter.length) throw new Error('keine Reiter gefunden');

  const seiten = [];
  for (const r of reiter) {
    const ordnerName = slug(r.name);
    const ordner = path.join(ZIEL, ordnerName);
    /* Der Reiter-Ordner wird ZUERST geleert: bleibt ein Bild einer Pille liegen, die
     * es nicht mehr gibt, zeigt die Seite es nicht - und der Ordner behauptet
     * trotzdem eine Oberflaeche, die verschwunden ist. */
    if (!OHNE_BILDER) {
      fs.mkdirSync(ordner, { recursive: true });
      fs.readdirSync(ordner).filter((f) => /\.png$/i.test(f))
        .forEach((f) => fs.unlinkSync(path.join(ordner, f)));
    }
    await js("(function () { var b = document.querySelector('nav.tabs [data-tab=\"" + r.tab + "\"]'); if (b) b.click(); return 'ok'; })()");
    await schlaf(900);
    const pillen = await js("Array.prototype.map.call(document.querySelectorAll('#tab-" + r.tab + " .pills button[data-sub]'), function (b) {" +
      "return { sub: b.getAttribute('data-sub'), name: (b.textContent || '').trim() }; })");
    const liste = (pillen && pillen.length) ? pillen : [{ sub: null, name: r.name }];
    for (const p of liste) {
      const panelSel = p.sub ? '#sub-' + p.sub : '#tab-' + r.tab;
      const dateiName = p.sub || r.tab;
      if (p.sub) {
        await js("(function () { var b = document.querySelector('#tab-" + r.tab + " .pills [data-sub=\"" + p.sub + "\"]'); if (b) b.click(); return 'ok'; })()");
        await schlaf(900);
      }
      console.log('Reiter ' + r.name + ' / ' + p.name + ' (' + panelSel + '):');
      const bilder = await aufnehmen(win, ordner, dateiName);

      /* Zweiter Durchgang mit allen Klappen offen - nur dort, wo es benannte
       * Klappen gibt (data-klappe). Zugeklappt zeigt die Aufnahme des
       * Maschinenraums nur eine Liste von Ueberschriften und belegt gar nichts.
       * Geklickt wird nichts, es wird nur aufgeklappt. */
      const benannte = await js("document.querySelectorAll('" + panelSel + " details[data-klappe]').length");
      let bilderOffen = [];
      if (benannte) {
        await js("(function () { Array.prototype.forEach.call(" +
          "document.querySelectorAll('" + panelSel + " details[data-klappe]'), function (x) { x.open = true; }); return 'auf'; })()");
        await schlaf(1500);
        console.log('Reiter ' + r.name + ' / ' + p.name + ' (alle ' + benannte + ' Klappen offen):');
        bilderOffen = await aufnehmen(win, ordner, dateiName + '-offen');
      }

      /* Das INVENTAR wird mit ALLEN Klappen offen gelesen - auch den namenlosen,
       * die in anderen liegen. Nur dann ist gelesen, was es gibt, statt was gerade
       * aufgeklappt ist. Danach wieder zu, damit die naechste Pille denselben
       * Ausgangszustand hat wie diese. */
      await js("(function () { Array.prototype.forEach.call(" +
        "document.querySelectorAll('" + panelSel + " details'), function (x) { x.__zuvor = x.open; x.open = true; }); return 'auf'; })()");
      await schlaf(1200);
      const inv = JSON.parse(await js('(' + MESSCODE + ')(' + JSON.stringify(panelSel) + ')'));
      await js("(function () { Array.prototype.forEach.call(" +
        "document.querySelectorAll('" + panelSel + " details'), function (x) { x.open = !!x.__zuvor; }); return 'zu'; })()");
      await schlaf(300);

      if (inv.fehlt) throw new Error('Panel ' + panelSel + ' nicht gefunden');
      const gebuendelt = buendeln(inv.eintraege);
      console.log('  Inventar: ' + gebuendelt.length + ' Bloecke' +
        (gebuendelt.length !== inv.eintraege.length ? ' (aus ' + inv.eintraege.length + ' Knoten gebuendelt)' : '') +
        ', ' + inv.zeichen + ' Zeichen');
      seiten.push({ reiter: r.name, reiterOrdner: ordnerName, tab: r.tab,
                    pille: p.name, sub: p.sub, panel: panelSel,
                    eintraege: gebuendelt, zeichen: inv.zeichen,
                    bilder: bilder, bilderOffen: bilderOffen });
    }
  }

  const dialoge = JSON.parse(await js(DIALOGCODE));
  console.log('Dialoge: ' + dialoge.length);
  return { seiten, dialoge };
}

/* ---------------------------------------------------------------------------
 * Die Seite schreiben. */
function zeile(e) {
  const marke = e.art === 'klappe' ? '▸ Klappe: ' : (e.art === 'h2' ? '▪ ' : '· ');
  let s = '  '.repeat(e.tiefe) + marke + e.titel;
  if (e.mal > 1) s += '  (' + e.mal + '×)';
  if (e.kennung) s += '  [' + (e.eigeneKennung ? '#' : 'in #') + e.kennung + ']';
  if (e.stand) s += '  — Statuszeile: „' + e.stand + '“';
  if (e.verborgen) s += '  (verborgen: ' + e.verborgen + ')';
  return s;
}

/* Gleiche Zeile mehrfach hintereinander heisst: eine Liste zeichnet je Eintrag
   dieselbe Klappe (das Depot-Protokoll hat sechs „Auslöser & Szenario"). Das ist
   ein Block der Oberflaeche, kein sechsfacher - sechs Zeilen dafuer machen aus dem
   Inventar einen Datenauszug. Gebuendelt wird nur, was UNMITTELBAR aufeinander
   folgt und in Tiefe, Art und Titel uebereinstimmt. */
function buendeln(eintraege) {
  const out = [];
  eintraege.forEach((e) => {
    const v = out[out.length - 1];
    if (v && v.art === e.art && v.tiefe === e.tiefe && v.titel === e.titel &&
        v.stand === e.stand && v.verborgen === e.verborgen) { v.mal++; return; }
    out.push(Object.assign({ mal: 1 }, e));
  });
  return out;
}

function seiteBauen(erg, version) {
  const heute = new Date().toISOString().slice(0, 10);
  const out = [];
  out.push('---', 'tags: [bauplan]', '---', '# Struktur der Oberfläche — mit Aufnahmen', '');
  out.push('*Erzeugt am ' + heute + ' von `tools/ui-struktur.js` aus der **laufenden** Oberfläche der Version **' +
    version + '** — nicht aus `index.html`. Instanz: isolierte Kunstdaten-Instanz (`tools/kunstinstanz.js`), ' +
    BREITE + ' px breit, ohne Netz; die Zahlen darin sind erfunden, die Struktur ist die echte. ' +
    'Wer die Oberfläche umbaut, fährt das Werkzeug danach einmal — ein Aufruf erneuert Bilder und Seite: ' +
    '`.\\node_modules\\.bin\\electron.cmd tools\\ui-struktur.js`.*', '');
  out.push('**Was hier steht:** ▪ = Überschrift `h2`, · = Überschrift `h3`, ▸ = Klappe (`<details>`). ' +
    'Die Einrückung ist die echte Verschachtelung: eine Klappe **in** einer Klappe steht eine Stufe weiter rechts. ' +
    '`[#kennung]` ist die `id` des Blocks. „verborgen“ heißt: der Block steht in der Seite, ist aber ausgeblendet, ' +
    'bis etwas passiert (z. B. Explorer → „Kennzahlen“ erst nach dem Öffnen eines Werts).', '');
  out.push('**Grenze dieser Seite.** Sie zeigt, was die laufende Instanz in **diesem** Zustand hergibt — ' +
    'Kunstdepot, kein Netz, jede Klappe zum Lesen einmal geöffnet. Nicht darin: Blöcke, die nur im Fehlerfall ' +
    'erscheinen (Drossel-Hinweis, „N leer versucht“), Inhalte, die erst ein Netzabruf füllt (Explorer, ' +
    'Schein-Finder), und der Inhalt der Dialoge — die stehen unten nur mit ihrem Titel, geöffnet wird keiner. ' +
    'Fließtext, Knöpfe und Tabellen sind bewusst nicht aufgeführt: das hier ist das Inventar der Blöcke, ' +
    'kein Abzug der Seite.', '');

  /* ---- Der Baum ---- */
  out.push('## Baum', '', '```');
  let letzterReiter = null;
  erg.seiten.forEach((s, i) => {
    if (s.reiter !== letzterReiter) {
      if (letzterReiter !== null) out.push('');
      out.push(s.reiter + ' (data-tab="' + s.tab + '")');
      letzterReiter = s.reiter;
    }
    const letzte = i === erg.seiten.length - 1 || erg.seiten[i + 1].reiter !== s.reiter;
    out.push((letzte ? '└─ ' : '├─ ') + s.pille +
      (s.sub ? ' (data-sub="' + s.sub + '", ' + s.panel + ')' : ' (' + s.panel + ')'));
    s.eintraege.forEach((e) => out.push('   │  ' + zeile(e)));
  });
  if (erg.dialoge.length) {
    out.push('', 'Dialoge (gehören zu keinem Reiter)');
    erg.dialoge.forEach((d, i) => {
      out.push((i === erg.dialoge.length - 1 ? '└─ ' : '├─ ') + (d.titel || '(ohne Titel)') +
        (d.gekuerztVon ? '  (gekürzt von ' + d.gekuerztVon + ' Zeichen)' : '') + '  [#' + d.kennung + ']');
    });
  }
  out.push('```', '');

  /* ---- Je Reiter/Pille die Liste und die Bilder ---- */
  letzterReiter = null;
  erg.seiten.forEach((s) => {
    if (s.reiter !== letzterReiter) { out.push('## ' + s.reiter, ''); letzterReiter = s.reiter; }
    out.push('### ' + s.reiter + ' → ' + s.pille, '');
    out.push('`' + s.panel + '` · ' + s.eintraege.length + ' Blöcke · ' + s.zeichen + ' Zeichen sichtbarer Text', '');
    if (s.eintraege.length) {
      s.eintraege.forEach((e) => out.push('  '.repeat(e.tiefe) + '- ' + zeile(e).trimStart()));
    } else {
      out.push('*Keine Überschrift und keine Klappe — dieses Panel besteht aus Karten ohne eigene Überschrift.*');
    }
    out.push('');
    s.bilder.concat(s.bilderOffen).forEach((b) => out.push('![[aufnahmen/' + s.reiterOrdner + '/' + b + ']]'));
    if (s.bilder.length || s.bilderOffen.length) out.push('');
  });

  /* ---- Dialoge ---- */
  out.push('## Dialoge', '');
  out.push('Modaldialoge am Ende von `index.html`. Sie gehören zu **keinem** Reiter — die Fassung vom 04.09. ' +
    'hatte sie Werkzeuge → Betrieb zugeschlagen (QS-Fund S7). Geöffnet wird hier keiner; aufgeführt ist der ' +
    'Titel, den auch ein Screenreader vorliest (`aria-labelledby`).', '');
  erg.dialoge.forEach((d) => {
    out.push('- **' + (d.titel || '(ohne Titel — wird erst zur Laufzeit gefüllt)') + '**  [#' + d.kennung + ']' +
      (d.titelKennung ? '  · Titel aus `#' + d.titelKennung + '`' : '') +
      (d.gekuerztVon ? '  · hier gekürzt, im Dialog ' + d.gekuerztVon + ' Zeichen' : ''));
  });
  out.push('');
  return out.join('\n');
}

/* Hartes Zeitlimit: eine haengende Sonde ist ein Befund, kein Grund zu warten. */
setTimeout(() => { console.error('UI-Struktur: Zeitlimit (900 s) erreicht.'); app.exit(2); }, 900000);

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  win.webContents.once('did-finish-load', async () => {
    try {
      /* Die Start-Renderings (Skeletons, erste Abrufe) abwarten - Rezept §6 nennt 7 s. */
      await schlaf(7000);
      const erg = await lauf(win);
      const version = JSON.parse(fs.readFileSync(path.join(WURZEL, 'package.json'), 'utf8')).version;
      fs.mkdirSync(ZIEL, { recursive: true });
      const datei = path.join(ZIEL, 'struktur.md');
      fs.writeFileSync(datei, seiteBauen(erg, version), 'utf8');
      const bilder = erg.seiten.reduce((n, s) => n + s.bilder.length + s.bilderOffen.length, 0);
      const bloecke = erg.seiten.reduce((n, s) => n + s.eintraege.length, 0);
      console.log('\nUI-Struktur: ' + erg.seiten.length + ' Panels, ' + bloecke + ' Bloecke, ' +
        erg.dialoge.length + ' Dialoge, ' + bilder + ' Bilder');
      console.log('Geschrieben: ' + datei);
      app.exit(0);
    } catch (e) {
      console.error('UI-Struktur abgebrochen: ' + (e && e.stack || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
