'use strict';
/* ================= Der Boersenkalender - eine Tatsache statt einer Liste =================
 *
 * WARUM ES DIESE DATEI GIBT. Der Plan schloss Halbtage ueber eine von Hand geschriebene
 * Liste aus (Handelsende 13:00 ET statt 16:00). Probe 2, Frage E hat gezeigt, warum das zu
 * schwach ist: ein Abruf um 15:55 ET an einem Halbtag liefert KEINEN Fehler und keine Luecke,
 * sondern einen plausibel aussehenden Quote - AAPL am 23.11.2018, 15:53 ET, Spanne 0,0523 Pp.
 * Das ist ein nachboerslicher Quote, fuenfmal so breit wie mittags, und er wuerde als
 * Schlussfenster-Beobachtung in die Tabelle laufen. Genau die Bauform der iex-Falle: HTTP 200,
 * keine Warnung, falsche Groesse.
 *
 * Gegen eine handgeschriebene Liste steht ausserdem, dass sie still veraltet und dass ihre
 * Richtigkeit vom Gedaechtnis dessen abhaengt, der sie tippt (die erste Fassung fuehrte
 * 2016-12-23 und 2026-07-02 als Halbtage - beides Vermutung, keine Fundstelle).
 *
 * Der Kalender kommt deshalb aus der Quelle: /v2/calendar liefert je Handelstag `open` und
 * `close` in ET. Ein Tag gilt als VOLLER Handelstag, wenn er um 16:00 schliesst. Alles andere
 * faellt aus der Ziehung - nicht weil die Daten stoeren, sondern weil die drei Tagesfenster
 * der Studie dort nicht existieren.
 *
 * Nur lesend. Keine Kontoeinstellung, keine Order.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */

var fs = require('fs');
var path = require('path');
var S = require('./schluessel.js');

var HANDEL = 'https://paper-api.alpaca.markets/v2';
var ZIEL = process.env.MD_SPANNEN || 'E:/Markt-Dashboard-Archiv/spannen';
var DATEI = path.join(ZIEL, 'kalender.json');

/** Holt den Kalender 2015-2026 und legt ihn ab. Gibt {ok, tage, halbtage, grund}. */
async function holen() {
  var url = HANDEL + '/calendar?start=2015-01-01&end=2026-12-31';
  var res, text;
  try {
    res = await fetch(url, { headers: S.kopfzeilen() });
    text = await res.text();
  } catch (e) {
    return { ok: false, grund: 'Netzfehler: ' + S.verdecken(e && e.message ? e.message : String(e)) };
  }
  if (res.status !== 200) {
    return { ok: false, grund: 'HTTP ' + res.status + ' – ' + S.verdecken(String(text).slice(0, 200)) };
  }
  var roh; try { roh = JSON.parse(text); } catch (e) { return { ok: false, grund: 'Antwort ist kein JSON' }; }
  if (!Array.isArray(roh) || !roh.length) return { ok: false, grund: 'Kalender ist leer' };

  var tage = {}, halbtage = [];
  for (var i = 0; i < roh.length; i++) {
    var t = roh[i];
    if (!t || !t.date) continue;
    var voll = t.close === '16:00';
    tage[t.date] = { auf: t.open, zu: t.close, voll: voll };
    if (!voll) halbtage.push({ datum: t.date, zu: t.close });
  }
  fs.mkdirSync(ZIEL, { recursive: true });
  fs.writeFileSync(DATEI, JSON.stringify({ geholt: new Date().toISOString(), quelle: '/v2/calendar',
    handelstage: Object.keys(tage).length, halbtage: halbtage, tage: tage }, null, 0));
  return { ok: true, tage: tage, halbtage: halbtage, datei: DATEI };
}

/** Liest den abgelegten Kalender. null, wenn er fehlt. */
function lesen() {
  try { return JSON.parse(fs.readFileSync(DATEI, 'utf8')); } catch (e) { return null; }
}

module.exports = { holen: holen, lesen: lesen, DATEI: DATEI };

if (require.main === module) {
  holen().then(function (r) {
    if (!r.ok) { process.stdout.write('FEHLGESCHLAGEN: ' + r.grund + '\n'); return; }
    process.stdout.write('Kalender abgelegt: ' + r.datei + '\n');
    process.stdout.write('  Handelstage 2015-2026: ' + Object.keys(r.tage).length + '\n');
    process.stdout.write('  davon nicht bis 16:00: ' + r.halbtage.length + '\n');
    r.halbtage.forEach(function (h) { process.stdout.write('    ' + h.datum + '  Schluss ' + h.zu + '\n'); });
  });
}
