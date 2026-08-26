'use strict';
/* ================= WACHHUND FUER DIE KURSARCHIVE =================
 *
 * WOZU. Am 26.08.2026 stand das Stundenarchiv zwei Tage still, ohne dass es jemand
 * merkte - und zwar aus einem Grund, der von aussen wie Gesundheit aussieht:
 * `node tools/yahoo-60m-holen.js alle` ueberspringt jeden Wert, den es schon hat,
 * meldet "schon geholt: 2916 ... Nichts zu tun." und geht mit Erfolg aus. Wer neue
 * Kerzen wollte, brauchte --aktualisieren; ohne den Schalter lernt der Lauf nichts
 * dazu und sagt es auch nicht.
 * Ein Lauf, der nichts dazulernt, sieht von aussen aus wie ein gesunder Lauf. Genau
 * diese Klasse Fehler soll hier auffliegen.
 *
 * WAS GEPRUEFT WIRD. Wie alt ist die JUENGSTE Kerze des Archivs, gemessen am letzten
 * abgeschlossenen Handelstag? Nicht "wann wurde die Datei geschrieben" - das war die
 * Falle: am 26.08. um 00:49 wurden alle 2.887 Dateien neu geschrieben (von der
 * Teilkerzen-Bereinigung) und trugen trotzdem nur Daten bis zum 24.08.
 *
 * FEIERTAGE KENNT DIESES WERKZEUG NICHT. Ein Rueckstand von EINEM Handelstag kann
 * ein Feiertag sein; deshalb wird dort gewarnt, aber nicht Alarm geschlagen. Ab zwei
 * Tagen ist es kein Feiertag mehr. Wer es genauer will, braucht einen Kalender - und
 * der waere eine eigene Entscheidung, keine Reparatur.
 *
 * Aufruf:
 *   node tools/archiv-wachhund.js                 beide Archive (60m und 1d)
 *   node tools/archiv-wachhund.js archiv60m       nur eines
 *   node tools/archiv-wachhund.js --stichprobe 200
 *
 * Exit 0: frisch.  Exit 1: Rueckstand ab zwei Handelstagen.  Exit 2: nicht pruefbar.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');

var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');
var ZEIGER = { archiv60m: { env: 'MD_ARCHIV60M', datei: 'archiv60m-pfad.txt' },
               archiv1d: { env: 'MD_ARCHIV1D', datei: 'archiv1d-pfad.txt' } };

function ordnerVon(name) {
  var z = ZEIGER[name];
  if (!z) return null;
  if (process.env[z.env]) return process.env[z.env];
  try {
    var p = fs.readFileSync(path.join(DATEN, z.datei), 'utf8').replace(/^﻿/, '').trim();
    if (p) return p;
  } catch (e) { /* keine Zeigerdatei */ }
  return path.join(DATEN, name);
}

/* Der letzte Handelstag, der ABGESCHLOSSEN ist. Die US-Sitzung endet um 20:00 UTC;
 * eine halbe Stunde Zuschlag, weil Yahoo die Schlusskerze nicht in derselben Sekunde
 * hat. Samstag und Sonntag zaehlen nie. */
function letzterAbgeschlossenerHandelstag(jetzt) {
  var d = new Date(jetzt.getTime());
  var heuteFertig = d.getUTCHours() > 20 || (d.getUTCHours() === 20 && d.getUTCMinutes() >= 30);
  if (!heuteFertig) d.setUTCDate(d.getUTCDate() - 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/* Handelstage zwischen zwei Datumsangaben - Wochenenden ausgenommen, Feiertage nicht
 * bekannt. Die Zahl ist damit eine OBERGRENZE des echten Rueckstands. */
function handelstageDazwischen(vonTag, bisTag) {
  var a = new Date(vonTag + 'T00:00:00Z'), b = new Date(bisTag + 'T00:00:00Z');
  var n = 0;
  while (a < b) {
    a.setUTCDate(a.getUTCDate() + 1);
    if (a.getUTCDay() !== 0 && a.getUTCDay() !== 6) n++;
  }
  return n;
}

function juengsteKerze(datei) {
  try {
    var j = JSON.parse(fs.readFileSync(datei, 'utf8'));
    var s = j.series || j.bars || [];
    if (!s.length) return null;
    return new Date(s[s.length - 1][0]).toISOString().slice(0, 10);
  } catch (e) { return null; }
}

/** Prueft einen Archivordner. Gibt einen Befund zurueck statt zu drucken - so kann
 *  das Abrufwerkzeug denselben Befund am Ende SEINES Laufs melden, ohne die Logik
 *  ein zweites Mal zu haben. Zwei Rechnungen fuer dieselbe Frage waeren die naechste
 *  Stelle, an der eine still falsch wird. */
function pruefe(ordner, opt) {
  opt = opt || {};
  var jetzt = opt.jetzt || new Date();
  if (!fs.existsSync(ordner)) return { ok: false, grund: 'Ordner fehlt: ' + ordner, ordner: ordner };
  var dateien = fs.readdirSync(ordner).filter(function (f) { return /^bars_.*\.json$/.test(f); });
  if (!dateien.length) return { ok: false, grund: 'keine Kursdateien in ' + ordner, ordner: ordner };
  /* Gleichmaessige Stichprobe statt der ersten N - die ersten sind alphabetisch und
   * damit womoeglich alle aus einem Nachladelauf. */
  var n = opt.stichprobe && opt.stichprobe < dateien.length ? opt.stichprobe : dateien.length;
  var schritt = Math.max(1, Math.floor(dateien.length / n));
  var tage = {}, gelesen = 0, unlesbar = 0;
  for (var i = 0; i < dateien.length; i += schritt) {
    var t = juengsteKerze(path.join(ordner, dateien[i]));
    if (!t) { unlesbar++; continue; }
    tage[t] = (tage[t] || 0) + 1; gelesen++;
  }
  if (!gelesen) return { ok: false, grund: 'keine Datei lesbar', ordner: ordner };
  /* Der HAEUFIGSTE juengste Tag, nicht der spaeteste: ein einzelner frisch
   * nachgeladener Wert soll das Archiv nicht gesund aussehen lassen. Genau so ist
   * der Fehler entstanden - 69 Werte waren aktuell, 2.847 nicht. */
  var haeufigster = Object.keys(tage).sort(function (a, b) { return tage[b] - tage[a]; })[0];
  var spaetester = Object.keys(tage).sort()[Object.keys(tage).length - 1];
  var soll = letzterAbgeschlossenerHandelstag(jetzt);
  var rueckstand = handelstageDazwischen(haeufigster, soll);
  return {
    ok: rueckstand < 2, ordner: ordner, dateien: dateien.length, gelesen: gelesen, unlesbar: unlesbar,
    juengsterTagHaeufig: haeufigster, juengsterTagSpaetester: spaetester,
    anteilAufStand: tage[soll] ? tage[soll] / gelesen : 0,
    sollTag: soll, rueckstandHandelstage: rueckstand,
    verteilung: tage
  };
}

function textZu(b) {
  if (b.grund) return 'NICHT PRUEFBAR: ' + b.grund;
  var z = path.basename(b.ordner) + ': juengste Kerze ' + b.juengsterTagHaeufig +
    ', letzter abgeschlossener Handelstag ' + b.sollTag +
    ' -> Rueckstand ' + b.rueckstandHandelstage + ' Handelstag(e)' +
    '  [' + b.gelesen + ' von ' + b.dateien + ' geprueft, ' +
    Math.round(b.anteilAufStand * 100) + ' % auf Stand]';
  if (b.rueckstandHandelstage >= 2) z += '\n  ALARM: Das Archiv steht still. Ein Lauf ohne --aktualisieren holt NICHTS nach -' +
    '\n         er meldet "Nichts zu tun" und geht mit Erfolg aus.';
  else if (b.rueckstandHandelstage === 1) z += '\n  Hinweis: ein Handelstag Rueckstand - kann ein Feiertag sein, dieses Werkzeug kennt keine.';
  return z;
}

module.exports = { pruefe: pruefe, textZu: textZu, letzterAbgeschlossenerHandelstag: letzterAbgeschlossenerHandelstag,
  handelstageDazwischen: handelstageDazwischen, ordnerVon: ordnerVon };

if (require.main === module) {
  var args = process.argv.slice(2);
  var stich = 0;
  var si = args.indexOf('--stichprobe');
  if (si !== -1) { stich = parseInt(args[si + 1], 10) || 0; args.splice(si, 2); }
  var namen = args.length ? args : ['archiv60m', 'archiv1d'];
  var schlimm = 0, unpruefbar = 0;
  namen.forEach(function (nm) {
    var b = pruefe(ordnerVon(nm) || nm, { stichprobe: stich });
    console.log(textZu(b));
    if (b.grund) unpruefbar++;
    else if (!b.ok) schlimm++;
  });
  process.exit(schlimm ? 1 : (unpruefbar ? 2 : 0));
}
