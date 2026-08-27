'use strict';
/* ================= Populationsfrage, 60m-Seite (PM-Auftrag 27.08.) =================
 *
 * Die App-Seite ist gemessen (PM, 990.509 Kerzen 1m/5m/15m: ALLE in der regulaeren
 * Sitzung). Hier die andere Haelfte: fuehrt archiv60m systematisch Kerzen AUSSERHALB
 * der regulaeren Sitzung, und wenn ja, wie viele ueber wie viele Reihen? Diese Zahl
 * braucht Wilhelm fuer den Populations-Entscheid (gehoeren AH-Kerzen ins Archiv?).
 *
 * NUR LESEND. ERST NACH SPERRFALL fahren (der Nachlader schreibt bis ~03:40).
 * Sitzungslage ueber minutenSeitOeffnung/sitzungsMinuten - behandelt Sommer-/
 * Winterzeit UND Halbtage korrekt (eine feste 13:30-20:00-Schablone taete das nicht).
 *
 * Aufruf: node studien/datenfund-dochte-2026-08-27/population-60m.js */
var fs = require('fs'), path = require('path');
var Boerse = require(path.join(__dirname, '..', '..', 'boerse.js'));
var Q = require(path.join(__dirname, '..', '..', 'quant.js'));
var D = 'E:/Markt-Dashboard-Archiv/archiv60m';

function dateien(ordner) {
  var out = [];
  fs.readdirSync(ordner, { withFileTypes: true }).forEach(function (e) {
    var p = path.join(ordner, e.name);
    if (e.isDirectory() && !/^backup/.test(e.name)) out = out.concat(dateien(p));
    else if (/^bars_60m_.*\.json$/.test(e.name)) out.push(p);
  });
  return out;
}
function sperreAktiv(ordner) {
  var p = path.join(ordner, '_laeuft.json');
  if (!fs.existsSync(p)) return null;
  var j; try { j = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; }
  var start = Date.parse(j.start);
  if (!isFinite(start) || (Date.now() - start) / 3600000 >= 6) return null;
  if (j.pid) { try { process.kill(j.pid, 0); } catch (e) { return null; } }
  return j;
}
var sp = sperreAktiv(D);
if (sp) { console.error('ABBRUCH: archiv60m wird geschrieben (PID ' + sp.pid + '). Nach dem Lauf wiederholen.'); process.exit(2); }

var gesamt = 0, sitzung = 0, vor = 0, nach = 0, unbekannt = 0;
var reihenMitAH = 0, reihen = 0;
var nachVol0 = 0, nachHalbtag = 0, nachNormaltag = 0;
var jeStunde = {};
dateien(D).forEach(function (f) {
  var j; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return; }
  var s = j.series; if (!Array.isArray(s)) return;
  reihen++;
  var hatAH = false;
  s.forEach(function (k) {
    gesamt++;
    var m = null; try { m = Q.minutenSeitOeffnung(k[0]); } catch (e) { m = null; }
    var sm = Boerse.sitzungsMinuten(k[0]);
    if (m == null || sm == null) { unbekannt++; return; }
    if (m < 0) { vor++; hatAH = true; return; }
    if (m >= sm) {
      nach++; hatAH = true;
      if ((k[2] || 0) === 0) nachVol0++;
      if (Boerse.halbtagAn(k[0])) nachHalbtag++; else nachNormaltag++;
      var st = new Date(k[0]).toISOString().slice(11, 13);
      jeStunde[st] = (jeStunde[st] || 0) + 1;
      return;
    }
    sitzung++;
  });
  if (hatAH) reihenMitAH++;
});

console.log('archiv60m, Populationszaehlung (nur lesend):');
console.log('  Reihen: ' + reihen + '  |  Kerzen gesamt: ' + gesamt.toLocaleString('de'));
console.log('  in der Sitzung:   ' + sitzung.toLocaleString('de'));
console.log('  VOR der Sitzung:  ' + vor.toLocaleString('de'));
console.log('  NACH der Sitzung: ' + nach.toLocaleString('de') + '  (davon Volumen 0: ' + nachVol0.toLocaleString('de') + ')');
console.log('  Lage unbestimmbar: ' + unbekannt.toLocaleString('de'));
console.log('  Reihen mit mind. einer Randzeit-Kerze: ' + reihenMitAH + ' von ' + reihen);
console.log('  Nach-Sitzung nach Tagestyp: Halbtag ' + nachHalbtag.toLocaleString('de') + '  |  Normaltag ' + nachNormaltag.toLocaleString('de'));
console.log('  Nach-Sitzung je UTC-Stunde: ' + JSON.stringify(jeStunde));
console.log('\nLesart: Randzeit-Kerzen > 0 bestaetigt die zweite Haelfte der Populationsfrage -');
console.log('das 60m-Archiv (Nachlader) fuehrt eine Population, die die App-Sammlung (1m/5m/15m,');
console.log('gemessen 0 von 990.509) nicht fuehrt. Die Groesse dieser fremden Population ist die');
console.log('Zahl fuer Wilhelms Entscheid.');
