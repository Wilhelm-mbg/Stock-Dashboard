'use strict';
/* Tueftler, 27.08.2026 - wie schnell verfaellt der Rand des rollenden Fensters?
 *
 * ANLASS: Alle 305.908 abgelegten Kerzen der Verschwundenen tragen [t,c,v,h,l] -
 * KEINEN Eroeffnungskurs. Die Quelle liefert ihn (Sonde probe-eroeffnung.js:
 * Feldnamen c h l n o t v vw), die Ablage hat ihn weggeworfen. Nachholen geht nur
 * per erneutem Abruf - und der reicht nur 730 Tage zurueck. Jeder Tag Verzoegerung
 * kostet also dauerhaft die Eroeffnungskurse eines weiteren Handelstages.
 *
 * Diese Zaehlung beziffert das Tempo. Sie liest nur, sie schreibt nur ihr Ergebnis.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');

var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive');
var tdOrdner = path.join(DATEN, 'tagesdaten');
var JETZT = Date.parse(process.env.HEUTE || '2026-08-27T00:00:00Z');
var FENSTER_TAGE = 730;

function tag(ts) { return new Date(ts).toISOString().slice(0, 10); }

var jeTag = {};
var dateien = fs.readdirSync(tdOrdner).filter(function (f) { return f.slice(-5) === '.json'; });
var gesamt = 0;
for (var i = 0; i < dateien.length; i++) {
  var j;
  try { j = JSON.parse(fs.readFileSync(path.join(tdOrdner, dateien[i]), 'utf8')); } catch (e) { continue; }
  var s = j.series || [];
  for (var k = 0; k < s.length; k++) {
    var t = tag(s[k][0]);
    jeTag[t] = (jeTag[t] || 0) + 1;
    gesamt++;
  }
}

var tage = Object.keys(jeTag).sort();
function summeBis(grenze) {
  var n = 0;
  for (var a = 0; a < tage.length; a++) if (tage[a] < grenze) n += jeTag[tage[a]];
  return n;
}
function randNach(tageSpaeter) { return tag(JETZT + tageSpaeter * 86400000 - FENSTER_TAGE * 86400000); }

var zeilen = [];
[0, 7, 14, 30, 60, 90].forEach(function (v) {
  var g = randNach(v);
  zeilen.push({
    verzoegerungTage: v,
    fensterrand: g,
    kerzenAusserhalb: summeBis(g),
    anteilProzent: Math.round(summeBis(g) / gesamt * 10000) / 100
  });
});

var out = {
  erzeugt: new Date().toISOString(),
  frage: 'Wie viele Symbol-Tage der Verschwundenen fallen je Woche Verzoegerung dauerhaft aus dem 730-Tage-Fenster?',
  hinweis: 'Betrifft NUR die Eroeffnungskurse. Schluss/Hoch/Tief/Umsatz dieser Tage liegen bereits auf der Platte und bleiben.',
  kerzenGesamt: gesamt,
  reihen: dateien.length,
  ersteKerzeImBestand: tage[0],
  letzteKerzeImBestand: tage[tage.length - 1],
  verlustuhr: zeilen,
  verlustJeWocheAbHeute: zeilen[1].kerzenAusserhalb - zeilen[0].kerzenAusserhalb,
  belegungJeTagAmRand: (function () {
    var r = {}, g0 = randNach(0);
    for (var a = 0; a < tage.length && a < 40; a++) r[tage[a]] = jeTag[tage[a]] + (tage[a] < g0 ? ' (schon draussen)' : '');
    return r;
  })()
};
var ziel = path.join(__dirname, '..', 'daten', 'zaehlung-randverlust-2026-08-27.json');
fs.writeFileSync(ziel, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
console.log('geschrieben: ' + ziel);
