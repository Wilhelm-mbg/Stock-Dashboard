'use strict';
/* NYSE-HANDELSKALENDER AUS EINER REGEL (Auftrag Nr. 123, 23.10.2026) - fuer die Panel-Fortschreibung ueber das Ende von
 * E:/Markt-Dashboard-Archiv/alpaca1m/_kalender.json (geholt 03.09.2026, endet 2026-12-31) hinaus, bis mindestens 2030.
 *
 * QUELLE DER REGEL: NYSE Rule 7.2 ("Holidays") und die von der NYSE veroeffentlichte Liste der Feiertage und verkuerzten
 * Handelstage (nyse.com, "Holidays & Trading Hours"): New Year's Day, Martin Luther King Jr. Day (3. Montag Januar),
 * Washington's Birthday (3. Montag Februar), Good Friday, Memorial Day (letzter Montag Mai), Juneteenth (19. Juni, seit 2022),
 * Independence Day (4. Juli), Labor Day (1. Montag September), Thanksgiving (4. Donnerstag November), Christmas (25. Dezember).
 * Faellt ein Feiertag auf einen Samstag, schliesst die Boerse am Freitag davor, auf einen Sonntag am Montag danach - AUSSER
 * Neujahr an einem Samstag: dann bleibt der 31.12. ein Handelstag (Rule 7.2, Ende des Rechnungsjahres).
 * Verkuerzt (13:00 ET): Tag nach Thanksgiving; 24.12., wenn Werktag und nicht selbst Feiertag; 3.7., wenn Werktag und der
 * 4.7. auf Dienstag bis Freitag faellt.
 * GEPRUEFT gegen den Alpaca-Kalender 2016-2026 (tools/panel-fortschreiben.test.js): jeder Tag und jede Uhrzeit gleich, ausser
 * den Sonderschliessungen unten (Staatstrauer - nicht vorhersagbar; eine kuenftige steht erst nach der Ankuendigung fest
 * und wird dann in SONDER eingetragen).
 *
 * Kein Netz, keine Abhaengigkeiten. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var SONDER = { '2018-12-05': 'Staatstrauer George H. W. Bush', '2025-01-09': 'Staatstrauer Jimmy Carter' };

function z2(n) { return (n < 10 ? '0' : '') + n; }
function txt(j, m, d) { return j + '-' + z2(m) + '-' + z2(d); }
function wt(j, m, d) { return new Date(Date.UTC(j, m - 1, d)).getUTCDay(); }           /* 0 = Sonntag */
function nterWochentag(j, m, wtag, n) { var d = 1; while (wt(j, m, d) !== wtag) d++; return d + 7 * (n - 1); }
function letzterWochentag(j, m, wtag) { var d = new Date(Date.UTC(j, m, 0)).getUTCDate(); while (wt(j, m, d) !== wtag) d--; return d; }
/** Ostersonntag (Gauss/Anonymous Gregorian, Meeus). */
function ostern(j) {
  var a = j % 19, b = Math.floor(j / 100), c = j % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  var h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  var monat = Math.floor((h + l - 7 * m + 114) / 31), tag = ((h + l - 7 * m + 114) % 31) + 1;
  return { m: monat, d: tag };
}
function plusTage(t, n) { var d = new Date(Date.parse(t + 'T00:00:00Z') + n * 86400000); return d.toISOString().slice(0, 10); }
/** beobachteter Tag eines festen Feiertags (Sa -> Fr, So -> Mo); null = nicht beobachtet (Neujahr am Samstag). */
function beobachtet(j, m, d, neujahr) {
  var w = wt(j, m, d), t = txt(j, m, d);
  if (w === 6) return neujahr ? null : plusTage(t, -1);
  if (w === 0) return plusTage(t, 1);
  return t;
}
/** Feiertage eines Jahres: { 'YYYY-MM-DD': name }. */
function feiertage(j) {
  var f = {}, o = ostern(j);
  function setz(t, n) { if (t && +t.slice(0, 4) === j) f[t] = n; }
  setz(beobachtet(j, 1, 1, true), 'New Year');
  setz(txt(j, 1, nterWochentag(j, 1, 1, 3)), 'MLK');
  setz(txt(j, 2, nterWochentag(j, 2, 1, 3)), 'Washington');
  setz(plusTage(txt(j, o.m, o.d), -2), 'Good Friday');
  setz(txt(j, 5, letzterWochentag(j, 5, 1)), 'Memorial');
  if (j >= 2022) setz(beobachtet(j, 6, 19, false), 'Juneteenth');
  setz(beobachtet(j, 7, 4, false), 'Independence');
  setz(txt(j, 9, nterWochentag(j, 9, 1, 1)), 'Labor');
  setz(txt(j, 11, nterWochentag(j, 11, 4, 4)), 'Thanksgiving');
  setz(beobachtet(j, 12, 25, false), 'Christmas');
  return f;
}
/** verkuerzte Tage eines Jahres (13:00 ET). */
function halbtage(j, f) {
  var h = {};
  var thx = txt(j, 11, nterWochentag(j, 11, 4, 4)); h[plusTage(thx, 1)] = 1;
  var w24 = wt(j, 12, 24), t24 = txt(j, 12, 24); if (w24 >= 1 && w24 <= 5 && !f[t24]) h[t24] = 1;
  var w3 = wt(j, 7, 3), w4 = wt(j, 7, 4), t3 = txt(j, 7, 3); if (w3 >= 1 && w3 <= 5 && w4 >= 2 && w4 <= 5 && !f[t3]) h[t3] = 1;
  return h;
}
/** Handelstage [von, bis] im Format von _kalender.json: { 'YYYY-MM-DD': { open: '09:30', close: '16:00' | '13:00' } }. */
function tage(von, bis) {
  var aus = {}, j0 = +von.slice(0, 4), j1 = +bis.slice(0, 4);
  for (var j = j0; j <= j1; j++) {
    var f = feiertage(j), h = halbtage(j, f);
    for (var t = txt(j, 1, 1); +t.slice(0, 4) === j; t = plusTage(t, 1)) {
      if (t < von || t > bis) continue;
      var w = new Date(Date.parse(t + 'T00:00:00Z')).getUTCDay();
      if (w === 0 || w === 6 || f[t] || SONDER[t]) continue;
      aus[t] = { open: '09:30', close: h[t] ? '13:00' : '16:00' };
    }
  }
  return aus;
}
module.exports = { tage: tage, feiertage: feiertage, halbtage: halbtage, ostern: ostern, SONDER: SONDER,
  QUELLE: 'NYSE Rule 7.2 (Holidays) / NYSE Holidays & Trading Hours; geprueft gegen alpaca1m/_kalender.json 2016-2026' };
