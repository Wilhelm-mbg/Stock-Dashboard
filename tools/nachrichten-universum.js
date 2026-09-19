'use strict';
/* ================= Das Universum des Nachrichten-Archivs aus dem Tages-Panel =================
 *
 * Nr. 43 (19.09.2026): Die App sammelt Schlagzeilen nicht mehr fuer 17 Symbole aus dem
 * Code, sondern fuer die Klassen 1-3 des Tages-Panels (Querschnitts-Pruefstand,
 * studien/querschnitt-pruefstand-2026-09-13). Dieses Werkzeug schreibt die Liste als
 * Datei in den DATENORDNER (nicht ins Repo); die App liest sie beim naechsten Lauf
 * (nachrichtenablage.universumLesen) und faellt ohne Datei auf ihre alte Liste zurueck.
 *
 * Stichtag: der juengste Monatserste (erster Handelstag eines Monats) mit definiertem
 * Universum - dieselbe Punkt-in-Zeit-Regel wie im Pruefstand (universum(T, tag)), also
 * ohne Blick nach vorn. Die Namen kommen aus T.symName (Archivform, BRK.B mit Punkt;
 * die Yahoo-Form bildet die App selbst).
 *
 * Aufruf aus der Repo-Wurzel (das Panel liegt unter <Studie>/voll/panel, rund 10 Mio
 * Zeilen - Speicher mitgeben):
 *
 *   node --max-old-space-size=6144 tools/nachrichten-universum.js [--ziel <datei>] [--aus <panelordner>]
 *
 * Vorgabe Ziel: <Downloads>/Markt-Dashboard-Daten/nachrichten-universum.json.
 * Ausgabe: Stichtag, Zahl je Klasse, Gesamtzahl, Zielpfad. Kein Netz, kein Store. */
var fs = require('fs');
var path = require('path');
var os = require('os');

var STUDIE = path.join(__dirname, '..', 'studien', 'querschnitt-pruefstand-2026-09-13');
var KLASSEN = [1, 2, 3];
var KENNUNG = 'nachrichten-universum/v1';

function argumente(argv) {
  var a = {};
  for (var i = 0; i < argv.length; i++) if (/^--/.test(argv[i])) { a[argv[i].slice(2)] = argv[i + 1]; i++; }
  return a;
}

function main() {
  var a = argumente(process.argv.slice(2));
  var aus = a.aus || path.join(STUDIE, 'voll');
  var ziel = a.ziel || path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'nachrichten-universum.json');
  var PR = require(path.join(STUDIE, 'pruefstand.js'));
  process.stdout.write('Tafel laden aus ' + aus + ' ...\n');
  var T = PR.Tafel(aus);
  var tage = T.kal.tage;
  /* Monatserste: jeder Tag, dessen Monat sich vom Vortag unterscheidet; vom juengsten aus rueckwaerts. */
  var stichtag = -1, u = null;
  for (var i = T.maxTag; i > 0 && stichtag < 0; i--) {
    if (tage[i].slice(0, 7) === tage[i - 1].slice(0, 7)) continue;
    var v = PR.universum(T, i, { klassen: KLASSEN });
    if (v.liste.length) { stichtag = i; u = v; }
  }
  if (stichtag < 0) { process.stderr.write('Kein Monatserster mit definiertem Universum gefunden.\n'); process.exit(1); }
  var jeKlasse = {}, namen = {};
  u.liste.forEach(function (e) { jeKlasse[e.klasse] = (jeKlasse[e.klasse] || 0) + 1; namen[T.symName[e.sym]] = 1; });
  var symbole = Object.keys(namen).sort();
  var aussen = { kennung: KENNUNG, stand: new Date().toISOString(), quelle: 'panel/v2 Klassen 1-3 am ' + tage[stichtag],
    tag: tage[stichtag], jeKlasse: jeKlasse, verworfen: u.verworfen, symbole: symbole };
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  fs.writeFileSync(ziel, JSON.stringify(aussen, null, 1));
  process.stdout.write('Stichtag ' + tage[stichtag] + ': ' + symbole.length + ' Symbole (je Klasse ' + JSON.stringify(jeKlasse) +
    ', verworfen ' + JSON.stringify(u.verworfen) + ')\nGeschrieben: ' + ziel + '\n');
}

if (require.main === module) main();
module.exports = { KLASSEN: KLASSEN, KENNUNG: KENNUNG };
