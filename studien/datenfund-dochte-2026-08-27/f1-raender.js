'use strict';
/* ================= F1-Randkerzen: zaehlen und melden, nicht entscheiden =================
 *
 * PM-Auftrag 27.08. ~01:50: Der Universumsfilter F1 (messmaschine.js reiheKaputt:
 * Sprung > +400 % oder < -80 % zwischen benachbarten Tagesschluessen, oder Kurs
 * > 100.000 $) verwirft 36 GANZE Reihen - darunter BYND +2920 % am 2026-07-20.
 * Drei Fragen, alle nur ZAEHLEN (das Ergebnis geht an Wilhelm; der Filter ist
 * Messmaschinerie, eine Aenderung dort verschiebt jedes kuenftige Ergebnis):
 *   1. Wie viele der verworfenen Reihen haben EINEN Sprung, wie viele mehrere?
 *   2. Wie viele Spruenge liegen im frisch nachgeladenen Zeitraum (ab 2026-06-01)?
 *   3. Waeren sie mit einer RAND-Bereinigung statt Reihen-Verwerfung zu retten?
 *      Operationalisiert: alle Spruenge liegen innerhalb der ersten/letzten
 *      RAND_K Kerzen - dann liesse Rand-Kappung eine sprungfreie Restreihe.
 *
 * NUR LESEND auf archiv1d. ERST NACH SPERRFALL (~03:40).
 * Die Sprunglogik ist WOERTLICH reiheKaputt nachgebaut, nur dass ALLE Spruenge
 * gesammelt werden statt beim ersten abzubrechen - sonst ist "einer oder mehrere"
 * gar nicht beantwortbar. */
var fs = require('fs'), path = require('path');
var D = 'E:/Markt-Dashboard-Archiv/archiv1d';
var RAND_K = 5;
var FRISCH_AB = '2026-06-01';

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
if (sp) { console.error('ABBRUCH: archiv1d wird geschrieben (PID ' + sp.pid + '). Nach dem Lauf wiederholen.'); process.exit(2); }

function dateien(ordner) {
  var out = [];
  fs.readdirSync(ordner, { withFileTypes: true }).forEach(function (e) {
    var p = path.join(ordner, e.name);
    if (e.isDirectory() && !/^backup/.test(e.name)) out = out.concat(dateien(p));
    else if (/^bars_1d_.*\.json$/.test(e.name)) out.push(p);
  });
  return out;
}

var kaputte = [];
var reihen = 0;
dateien(D).forEach(function (f) {
  var j; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return; }
  var s = j.series; if (!Array.isArray(s) || s.length < 2) return;
  reihen++;
  var spruenge = [], maxKurs = 0;
  for (var i = 0; i < s.length; i++) {
    var c = s[i][1];
    if (c > maxKurs) maxKurs = c;
    if (i > 0) {
      var v = s[i - 1][1];
      if (v > 0 && c > 0) {
        var r = c / v - 1;
        if (r > 4 || r < -0.8) spruenge.push({ i: i, n: s.length, tag: new Date(s[i][0]).toISOString().slice(0, 10), pct: Math.round(r * 100) });
      }
    }
  }
  var kursKaputt = maxKurs > 100000;
  if (!spruenge.length && !kursKaputt) return;
  var sym = (j.sym || path.basename(f).replace(/^bars_1d_|\.json$/g, ''));
  var alleAmRand = spruenge.length > 0 && spruenge.every(function (x) { return x.i < RAND_K || x.i >= x.n - RAND_K; });
  var frisch = spruenge.filter(function (x) { return x.tag >= FRISCH_AB; }).length;
  kaputte.push({ sym: sym, spruenge: spruenge.length, kursKaputt: kursKaputt, alleAmRand: alleAmRand,
    frisch: frisch, laenge: s.length, detail: spruenge.slice(0, 3).map(function (x) { return x.tag + ' ' + (x.pct > 0 ? '+' : '') + x.pct + ' % (Kerze ' + x.i + '/' + x.n + ')'; }).join(' · ') });
});

console.log('archiv1d: ' + reihen + ' Reihen geprueft, F1-kaputt: ' + kaputte.length + '  (PM nannte 36 - Abweichung waere selbst ein Fund: anderer Archivstand oder andere Grundmenge)');
var einSprung = kaputte.filter(function (k) { return k.spruenge === 1 && !k.kursKaputt; });
var mehrere = kaputte.filter(function (k) { return k.spruenge > 1 && !k.kursKaputt; });
var nurKurs = kaputte.filter(function (k) { return k.spruenge === 0 && k.kursKaputt; });
var rettbar = kaputte.filter(function (k) { return k.alleAmRand && !k.kursKaputt; });
var mitFrisch = kaputte.filter(function (k) { return k.frisch > 0; });
console.log('\nDIE DREI ZAHLEN:');
console.log('  1. genau EIN Sprung: ' + einSprung.length + '  |  mehrere Spruenge: ' + mehrere.length + '  |  nur Kurs>100k: ' + nurKurs.length);
console.log('  2. mit Sprung im frischen Zeitraum (ab ' + FRISCH_AB + '): ' + mitFrisch.length);
console.log('  3. alle Spruenge am Rand (erste/letzte ' + RAND_K + ' Kerzen) -> mit Rand-Bereinigung rettbar: ' + rettbar.length);
console.log('\nJede Reihe einzeln:');
kaputte.sort(function (a, b) { return b.frisch - a.frisch || b.spruenge - a.spruenge; }).forEach(function (k) {
  console.log('  ' + k.sym.padEnd(7) + ' Spruenge ' + k.spruenge + (k.kursKaputt ? ' +Kurs>100k' : '') +
    '  Rand:' + (k.alleAmRand ? 'ja' : 'NEIN') + '  frisch:' + k.frisch + '  Laenge ' + k.laenge + '  | ' + k.detail);
});
console.log('\nKeine Aenderung, keine Empfehlung - Zahlen fuer Wilhelms Entscheid (Filter ist Messmaschinerie).');
