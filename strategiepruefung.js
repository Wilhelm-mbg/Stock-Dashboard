'use strict';
/* PRUEFUNG EINER STRATEGIEDATEI, BEVOR DIE APP SIE AUSFUEHRT (Sicherheits-Durchsicht
 * 2026-10, Fund F1).
 *
 * Bis 8.45 gab es zwei Kanaele, die zusammen jeden beliebigen Code starten konnten:
 * write-strategie legte JEDEN Text als .js ab, mess-lauf fuehrte ihn als Node-Prozess
 * aus. Ein einziges Skript im Renderer (eine HTML-Injektion, ein Chromium-Fehler)
 * genuegte damit fuer die volle Uebernahme des Benutzerkontos - die Sandbox des
 * Fensters half nicht mehr.
 *
 * Seitdem gibt es zwei Riegel, und nur der zweite ist eine echte Grenze:
 *
 *   1. INHALT (hier, inhaltPruefen): Eine Strategie aus der App ist eine reine
 *      Rechenfunktion ueber Kerzen. Sie braucht weder require noch process, weder
 *      eval noch Netz. Die Datei, die scoreboard.js baut, hat genau EINE erlaubte
 *      Ladezeile (quant.js) und EIN module.exports - alles darueber hinaus wird
 *      abgelehnt. Das ist eine Huerde, keine Sandbox: JavaScript laesst sich so
 *      verbiegen, dass eine Wortliste es nicht sieht. Deshalb gibt es Riegel 2.
 *
 *   2. FREIGABE IM HAUPTPROZESS (main.js, mess-lauf): Ausgefuehrt wird nur eine Datei,
 *      deren Pruefsumme der Nutzer in einem NATIVEN Dialog bestaetigt hat. Diesen
 *      Dialog kann kein Skript im Fenster anklicken. Die Liste der Freigaben liegt
 *      ausserhalb des Store-Ordners, den der Renderer ueber store-set beschreiben darf.
 *
 * Bewusst ohne Electron, damit die Pruefung ohne Fenster testbar ist. */

const Krypto = require('crypto');

/* Die beiden Zeilen, die scoreboard.js seit 23.08.2026 unveraendert erzeugt. Nur
 * wer GENAU so dasteht, darf require/process bzw. module/exports benutzen. */
const ERLAUBTE_ZEILEN = [
  "var Q = require(require('path').join(process.env.STOCK_DASHBOARD_QUELLE || '.', 'quant.js'));",
  'module.exports = {'
];

/* Ganze Woerter, die in einer reinen Rechenfunktion nichts verloren haben. Gross-
 * und Kleinschreibung zaehlt: "Prozess" oder "Modul" im Begruendungstext stoeren nicht. */
const VERBOTEN = [
  'require', 'process', 'module', 'exports', 'import', 'eval', 'Function',
  'constructor', 'prototype', '__proto__', '__defineGetter__', '__defineSetter__', '__lookupGetter__',
  'globalThis', 'global', 'Buffer', 'Reflect', 'Proxy', 'WebAssembly', 'Atomics', 'SharedArrayBuffer',
  'fetch', 'XMLHttpRequest', 'WebSocket', 'child_process', '__dirname', '__filename',
  'fromCharCode', 'fromCodePoint', 'atob', 'unescape', 'decodeURI', 'decodeURIComponent',
  'setTimeout', 'setInterval', 'setImmediate', 'queueMicrotask'
];

function inhaltPruefen(quelltext) {
  if (typeof quelltext !== 'string' || !quelltext.length) return { ok: false, grund: 'Quelltext fehlt.' };
  if (quelltext.length > 200000) return { ok: false, grund: 'Quelltext ist zu gross.' };
  /* Zeichen, mit denen sich Woerter tarnen lassen: Unicode-Escapes in Bezeichnern
   * (eval ist eval), Template-Literale (${...} ist Code in einer Zeichenkette). */
  if (/\\u|\\x/.test(quelltext)) return { ok: false, grund: 'Die Strategie enthält Escape-Folgen (\\u, \\x) – in einer Rechenregel nicht nötig.' };
  if (quelltext.indexOf('`') !== -1) return { ok: false, grund: 'Die Strategie enthält Backticks (Template-Literale) – bitte normale Anführungszeichen benutzen.' };
  if (/[\u0000-\u0008\u000e-\u001f\u007f\u2028\u2029]/.test(quelltext)) return { ok: false, grund: 'Die Strategie enthält Steuerzeichen.' };
  const zeilen = quelltext.split(/\r?\n/);
  let exportZeilen = 0;
  const rest = zeilen.map((z) => {
    const t = z.trim();
    if (t === ERLAUBTE_ZEILEN[1]) exportZeilen++;
    return ERLAUBTE_ZEILEN.indexOf(t) !== -1 ? '' : z;
  }).join('\n');
  if (exportZeilen !== 1) return { ok: false, grund: 'Die Strategie muss genau einmal „module.exports = {“ enthalten (so, wie die App sie ablegt).' };
  for (const w of VERBOTEN) {
    if (new RegExp('(^|[^A-Za-z0-9_$])' + w.replace(/\$/g, '\\$') + '($|[^A-Za-z0-9_$])').test(rest)) {
      return { ok: false, grund: 'Die Strategie benutzt „' + w + '“. Eine Regel aus der App rechnet nur über Kerzen und Parametern – ' +
        'Laden von Modulen, Prozess-, Netz- und Codezugriffe sind gesperrt. (Steht das Wort im Begründungstext, bitte umformulieren.)' };
    }
  }
  return { ok: true };
}

function pruefsumme(quelltext) {
  return Krypto.createHash('sha256').update(String(quelltext), 'utf8').digest('hex');
}

module.exports = { inhaltPruefen, pruefsumme, ERLAUBTE_ZEILEN, VERBOTEN };
