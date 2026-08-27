'use strict';
/* ZAEHLWERKZEUG des Strategie-Tueftlers - Bestandszaehlung, KEINE Messung.
 * NULL Netzabrufe. Reines Lesen von Platte.
 *
 * Frage: Das 1m-Fenster der Quelle rollt mit sieben Tagen. Was nicht binnen
 * sieben Tagen geholt wird, ist dauerhaft weg. Welche Handelstage fehlen im
 * Archiv - und welche davon sind noch INNERHALB des Fensters, also rettbar?
 *
 * Der Unterschied ist der ganze Punkt: eine Luecke innerhalb des Fensters ist
 * eine Aufgabe, eine Luecke ausserhalb ist ein Verlust. Beides gleich zu
 * zaehlen hiesse, Hektik und Trauer zu verwechseln.
 *
 * ⚠ Zwei Fallen, gegen die hier ausdruecklich gebaut ist:
 *   (1) "Hat Kerzen" vermengt drei Zustaende. Gezaehlt wird deshalb GETRENNT:
 *       Tage mit Umsatz > 0 (gehandelt) und Tage, an denen es nur Kerzen ohne
 *       Umsatz gibt (Stempel). Ein Tag, der nur Stempel traegt, ist NICHT
 *       abgedeckt.
 *   (2) Handelstage sind nicht Kalendertage. Welche Tage ueberhaupt Handelstage
 *       waren, wird NICHT geraten, sondern aus dem Bestand selbst erhoben: ein
 *       Tag gilt als Handelstag, wenn ihn eine MEHRHEIT der Reihen mit Umsatz
 *       fuehrt. Sonst zaehlte jeder Feiertag als Luecke.
 */
var fs = require('fs');
var path = require('path');

var ARCHIV = process.env.ARCHIV1M || 'E:/Markt-Dashboard-Archiv/archiv1m';
var STICHPROBE = Number(process.env.STICHPROBE || 0);   // 0 = alle
var FENSTER_TAGE = 7;

function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }

var dateien = fs.readdirSync(ARCHIV).filter(function (f) { return /^bars_1m_.*\.json$/.test(f); });
if (STICHPROBE > 0) {
  var schritt = Math.max(1, Math.floor(dateien.length / STICHPROBE));
  dateien = dateien.filter(function (_, i) { return i % schritt === 0; }).slice(0, STICHPROBE);
}

var mitUmsatz = new Map();     // Tag -> Anzahl Reihen, die den Tag MIT Umsatz fuehren
var nurStempel = new Map();    // Tag -> Anzahl Reihen, die den Tag nur ohne Umsatz fuehren
var proReihe = new Map();      // Symbol -> Set der Tage mit Umsatz
var kaputt = 0, gelesen = 0, letzterStempel = 0;

dateien.forEach(function (f) {
  var j;
  try { j = JSON.parse(fs.readFileSync(path.join(ARCHIV, f), 'utf8')); }
  catch (e) { kaputt++; return; }
  if (!j || !Array.isArray(j.series)) { kaputt++; return; }
  gelesen++;
  if (j.stand) { var s = Date.parse(j.stand); if (s > letzterStempel) letzterStempel = s; }

  var sym = f.slice(8, -5);
  var handel = new Set(), stempel = new Set();
  for (var i = 0; i < j.series.length; i++) {
    var b = j.series[i];
    var t = tagVon(b[0]);
    if ((b[2] || 0) > 0) handel.add(t); else stempel.add(t);
  }
  proReihe.set(sym, handel);
  handel.forEach(function (t) { mitUmsatz.set(t, (mitUmsatz.get(t) || 0) + 1); });
  stempel.forEach(function (t) { if (!handel.has(t)) nurStempel.set(t, (nurStempel.get(t) || 0) + 1); });
});

/* Handelstage aus dem Bestand erheben, nicht raten: Mehrheit der Reihen. */
var schwelle = Math.floor(gelesen * 0.5);
var alleTage = Array.from(mitUmsatz.keys()).sort();
var handelstage = alleTage.filter(function (t) { return mitUmsatz.get(t) >= schwelle; });

/* Fensterrand: heute minus sieben Kalendertage, aus dem juengsten Stempel des
 * Bestandes abgeleitet - nicht aus der Systemuhr, damit die Zahl reproduzierbar
 * bleibt, wenn jemand das Protokoll morgen nachliest. */
var bezug = letzterStempel || Date.now();
var randMs = bezug - FENSTER_TAGE * 86400000;
var rand = tagVon(randMs);

var zeilen = alleTage.map(function (t) {
  return {
    tag: t,
    reihenMitUmsatz: mitUmsatz.get(t) || 0,
    reihenNurStempel: nurStempel.get(t) || 0,
    anteil: Math.round((mitUmsatz.get(t) || 0) / gelesen * 1000) / 10,
    istHandelstag: (mitUmsatz.get(t) || 0) >= schwelle,
    imFenster: t >= rand,
  };
});

/* Luecken: Handelstage, an denen eine Reihe KEINEN Umsatz fuehrt, obwohl die
 * Mehrheit es tut. Getrennt nach rettbar (im Fenster) und verloren. */
var rettbar = 0, verloren = 0, luekenReihen = new Set();
handelstage.forEach(function (t) {
  var fehlend = gelesen - (mitUmsatz.get(t) || 0);
  if (fehlend <= 0) return;
  if (t >= rand) rettbar += fehlend; else verloren += fehlend;
});
proReihe.forEach(function (set, sym) {
  for (var i = 0; i < handelstage.length; i++) if (!set.has(handelstage[i])) { luekenReihen.add(sym); break; }
});

console.log(JSON.stringify({
  hinweis: 'NULL Netzabrufe. Nur Anzahlen. Kein Kurs- oder Ertragsmittelwert.',
  frage: 'Welche Handelstage fehlen im 1m-Archiv, und welche davon sind noch im Sieben-Tage-Fenster (rettbar)?',
  archiv: ARCHIV,
  reihenGelesen: gelesen, reihenKaputt: kaputt,
  juengsterAbrufstempel: new Date(bezug).toISOString(),
  fensterrand: rand,
  handelstageErkannt: handelstage.length,
  mehrheitsschwelle: schwelle,
  tage: zeilen,
  luecken: {
    reihenTage_rettbar: rettbar,
    reihenTage_verloren: verloren,
    reihenMitMindestensEinerLuecke: luekenReihen.size,
  },
}, null, 1));
