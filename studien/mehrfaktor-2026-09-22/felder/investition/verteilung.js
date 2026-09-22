'use strict';
/* Beschreibende Zusatzauswertung der Zelle `investition` (Auftrag Nr. 55 §1b): Quantile der Rohwerte je Jahr und Sektormix
 * des Dezils oben. KEINE Messung, keine Rendite, keine Statistik der Maschine. Liest nur die eigene Zelle
 * (zellen/investition.json), die eigenen Periodenreihen (zellen/investition-nullpunkt.json, nur nUni/mitWert/k zur Gegenprobe)
 * und die Sektorzuordnung der Tafel (sic je Kuerzel aus fundamentaltafel/tafel-*.jsonl, juengstes Filing der Reihe - nicht
 * punkt-in-Zeit, fuer einen Mix-Bericht ausreichend).
 *
 * "Dezil oben" hier = Naeherung nach der Rangregel der Maschine (Rang aufsteigend, Gleichstand = mittlerer Rang, Streckung
 * R = (r - 1/2) * n/m + 1/2, oben = R > 0,9 n) - nachgerechnet, weil die Maschine ihre Dezil-Mitglieder nicht ablegt
 * (Befund an den PM). Die Gegenprobe zaehlt, an wie vielen Signaltagen die Groesse mit dem k der Maschine uebereinstimmt.
 *
 *   node felder/investition/verteilung.js      (aus studien/mehrfaktor-2026-09-22; Ausgabe Markdown auf stdout)
 */
var fs = require('fs');
var path = require('path');
var readline = require('readline');
var S = path.join(__dirname, '..', '..');
var TAFEL = path.join(S, '..', 'fundamental-machbarkeit-2026-09-16', 'fundamentaltafel');
var Z = JSON.parse(fs.readFileSync(path.join(S, 'zellen', 'investition.json'), 'utf8'));
var NP = JSON.parse(fs.readFileSync(path.join(S, 'zellen', 'investition-nullpunkt.json'), 'utf8'));

function quantil(sortiert, p) { var h = (sortiert.length - 1) * p, lo = Math.floor(h), hi = Math.ceil(h); return sortiert[lo] + (sortiert[hi] - sortiert[lo]) * (h - lo); }
function f2(x) { return (Math.round(x * 100) / 100).toFixed(2); }
function pz(a, b) { return b ? (100 * a / b).toFixed(1) + ' %' : '-'; }

function division(sic) {
  if (sic === null || sic === undefined || isNaN(sic)) return 'ohne SIC';
  if (sic < 1000) return 'Landwirtschaft'; if (sic < 1500) return 'Bergbau/Oel'; if (sic < 1800) return 'Bau';
  if (sic < 4000) return 'Verarbeitendes Gewerbe'; if (sic < 5000) return 'Transport/Versorger/Kommunikation';
  if (sic < 5200) return 'Grosshandel'; if (sic < 6000) return 'Einzelhandel'; if (sic < 6800) return 'Finanzen/Immobilien';
  if (sic < 9000) return 'Dienstleistungen'; return 'Oeffentliche Verwaltung';
}
var GRUPPEN = { 'Finanzwerte (SIC 6000-6799)': function (s) { return s >= 6000 && s < 6800; },
  'Rohstoffe (SIC 1000-1499 Bergbau/Oel, 2911 Raffinerien)': function (s) { return (s >= 1000 && s < 1500) || s === 2911; },
  'Biotech/Pharma (SIC 2834, 2835, 2836, 8731)': function (s) { return s === 2834 || s === 2835 || s === 2836 || s === 8731; } };

/* Dezil oben je Signaltag nach der Rangregel der Maschine; Werte je Jahr sammeln */
var perJahr = {}, oben = [], obenJahr = {}, kGleich = 0, kAbw = [];
Z.signaltage.forEach(function (s, i) {
  var jahr = s.tag.slice(0, 4), namen = Object.keys(s.werte), n = namen.length;
  var mit = namen.filter(function (nm) { return typeof s.werte[nm] === 'number'; });
  var m = mit.length;
  (perJahr[jahr] = perJahr[jahr] || []).push.apply(perJahr[jahr], mit.map(function (nm) { return s.werte[nm]; }));
  mit.sort(function (a, b) { return s.werte[a] - s.werte[b]; });
  var rang = {}, q = 0;
  while (q < m) { var r = q; while (r + 1 < m && s.werte[mit[r + 1]] === s.werte[mit[q]]) r++; var mittel = (q + r) / 2 + 1; for (var j = q; j <= r; j++) rang[mit[j]] = mittel; q = r + 1; }
  var dez = mit.filter(function (nm) { return (rang[nm] - 0.5) * n / m + 0.5 > 0.9 * n; });
  var p = NP.einzelmessungPerioden[i];
  if (p && p.signaltag === s.tag) { if (p.k === dez.length && p.nUni === n && p.mitWert === m) kGleich++; else kAbw.push(s.tag + ': eigen k ' + dez.length + '/n ' + n + '/m ' + m + ', Maschine k ' + p.k + '/nUni ' + p.nUni + '/mitWert ' + p.mitWert); }
  dez.forEach(function (nm) { oben.push({ sym: nm, jahr: jahr, wert: s.werte[nm] }); });
  (obenJahr[jahr] = obenJahr[jahr] || []).push.apply(obenJahr[jahr], dez.map(function (nm) { return s.werte[nm]; }));
});

/* Sektor je Kuerzel: sic des juengsten Filings der Reihe aus der Tafel */
var sic = {}, dateien = fs.readdirSync(TAFEL).filter(function (d) { return /^tafel-\d{4}\.jsonl$/.test(d); }).sort();
(function naechste(idx) {
  if (idx >= dateien.length) return ausgabe();
  var rl = readline.createInterface({ input: fs.createReadStream(path.join(TAFEL, dateien[idx])) });
  rl.on('line', function (l) { var i = l.indexOf('"sic":'); if (i < 0) return; var z = JSON.parse(l); (z.sym || []).forEach(function (nm) { sic[nm] = (typeof z.sic === 'number') ? z.sic : null; }); });
  rl.on('close', function () { naechste(idx + 1); });
})(0);

function ausgabe() {
  var out = [];
  out.push('### Rohwert-Verteilung je Jahr (alle Universumsmitglieder mit Wert, Signaltag x Symbol; Pp, negativ = Vermoegenswachstum)');
  out.push('', '| Jahr | Werte | min | 5 % | 25 % | 50 % | 75 % | 95 % | max | Anteil < 0 (Wachstum) | Dezil oben: kleinster / Median Rohwert |', '|---|---|---|---|---|---|---|---|---|---|---|');
  Object.keys(perJahr).sort().forEach(function (j) {
    var v = perJahr[j].slice().sort(function (a, b) { return a - b; }), d = obenJahr[j].slice().sort(function (a, b) { return a - b; });
    var neg = v.filter(function (x) { return x < 0; }).length;
    out.push('| ' + j + ' | ' + v.length + ' | ' + f2(v[0]) + ' | ' + f2(quantil(v, 0.05)) + ' | ' + f2(quantil(v, 0.25)) + ' | ' + f2(quantil(v, 0.5)) + ' | ' + f2(quantil(v, 0.75)) + ' | ' + f2(quantil(v, 0.95)) + ' | ' + f2(v[v.length - 1]) + ' | ' + pz(neg, v.length) + ' | ' + f2(d[0]) + ' / ' + f2(quantil(d, 0.5)) + ' |');
  });
  var alle = [].concat.apply([], Object.keys(perJahr).map(function (j) { return perJahr[j]; })).sort(function (a, b) { return a - b; });
  out.push('', 'Alle Jahre: ' + alle.length + ' Werte, 5/25/50/75/95 % = ' + [0.05, 0.25, 0.5, 0.75, 0.95].map(function (p) { return f2(quantil(alle, p)); }).join(' / ') + ', min ' + f2(alle[0]) + ', max ' + f2(alle[alle.length - 1]) + '; unter -100 (Vermoegen mehr als verdoppelt): ' + alle.filter(function (x) { return x < -100; }).length + ', ueber +50 (Vermoegen mehr als halbiert): ' + alle.filter(function (x) { return x > 50; }).length + '.');
  out.push('', 'Gegenprobe Dezilgroesse gegen die Maschine (k, nUni, mitWert je Signaltag): ' + kGleich + ' von ' + Z.signaltage.length + ' Signaltage identisch' + (kAbw.length ? '; Abweichungen: ' + kAbw.slice(0, 5).join('; ') : '') + '.');

  /* Sektormix: Dezil oben gegen Universum mit Wert, ueber alle Signaltage (Symbol-Tage) */
  var uni = [].concat.apply([], Z.signaltage.map(function (s) { return Object.keys(s.werte).filter(function (nm) { return typeof s.werte[nm] === 'number'; }); }));
  function mix(liste, nameVon) { var c = {}; liste.forEach(function (x) { var k = nameVon(x); c[k] = (c[k] || 0) + 1; }); return c; }
  var dOben = mix(oben, function (o) { return division(sic[o.sym]); }), dUni = mix(uni, function (nm) { return division(sic[nm]); });
  var ohneSic = oben.filter(function (o) { return sic[o.sym] === undefined; }).length;
  out.push('', '### Sektormix des Dezils oben (Naeherung, Symbol-Tage ueber alle 92 Signaltage; Sektor = SIC-Division des juengsten Filings)', '', '| SIC-Division | Dezil oben | Universum mit Wert | Verhaeltnis |', '|---|---|---|---|');
  Object.keys(dUni).sort(function (a, b) { return dUni[b] - dUni[a]; }).forEach(function (k) { var a = (dOben[k] || 0) / oben.length, b = dUni[k] / uni.length; out.push('| ' + k + ' | ' + pz(dOben[k] || 0, oben.length) + ' (' + (dOben[k] || 0) + ') | ' + pz(dUni[k], uni.length) + ' (' + dUni[k] + ') | ' + (b ? (a / b).toFixed(2) : '-') + ' |'); });
  out.push('', '| Gruppe (Auftrag §1b) | Dezil oben | Universum mit Wert | Verhaeltnis |', '|---|---|---|---|');
  Object.keys(GRUPPEN).forEach(function (g) { var a = oben.filter(function (o) { return GRUPPEN[g](sic[o.sym]); }).length, b = uni.filter(function (nm) { return GRUPPEN[g](sic[nm]); }).length; out.push('| ' + g + ' | ' + pz(a, oben.length) + ' (' + a + ') | ' + pz(b, uni.length) + ' (' + b + ') | ' + ((b && oben.length) ? ((a / oben.length) / (b / uni.length)).toFixed(2) : '-') + ' |'); });
  out.push('', 'Dezil oben gesamt ' + oben.length + ' Symbol-Tage, Universum mit Wert ' + uni.length + '; Kuerzel ohne Tafelzeile (kein Sektor): ' + ohneSic + ' im Dezil oben.');
  process.stdout.write(out.join('\n') + '\n');
}
