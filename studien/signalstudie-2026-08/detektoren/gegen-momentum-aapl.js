var fs = require('fs'); var MOM = require('./momentum.js'); var M = require('../../../momentum.js');
var DIR = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/'; var uni = {};
fs.readdirSync(DIR).filter(function (f) { return /^bars_60m_/.test(f); }).forEach(function (f) { uni[f.slice(9, -5)] = JSON.parse(fs.readFileSync(DIR + f, 'utf8')).series; });
var vb = MOM.vorbereiten(uni);
// Reihenlaengen je Symbol: erster Tag, Anzahl Tage mit Kurs
var kurz = [];
vb.syms.forEach(function (s) { var a = vb.map[s]; var n = 0, erst = null; for (var k = 0; k < a.length; k++) if (a[k] != null) { n++; if (erst === null) erst = vb.zeiten[k]; } kurz.push([s, erst, n]); });
kurz.sort(function (a, b) { return b[2] - a[2]; });
console.log('Laengste:', JSON.stringify(kurz.slice(0, 3)), 'Kuerzeste:', JSON.stringify(kurz.slice(-12)));
// Wie viele Werte stehen je Signaltag in der Rangfolge?
var ns = [], minN = 1e9, maxN = 0, tage = 0;
for (var d = 0; d < vb.zeiten.length; d++) { var r = M.rangfolge(vb.map, d, {}); if (r) { tage++; if (r.length < minN) minN = r.length; if (r.length > maxN) maxN = r.length; ns.push(r.length); } }
console.log('Rangfolge vorhanden an', tage, 'Tagen, Werte je Tag min', minN, 'max', maxN, 'erster Tag', vb.zeiten[vb.zeiten.length - tage]);
// AAPL Rang-Verteilung
var posA = []; for (var d = 0; d < vb.zeiten.length; d++) { var r = M.rangfolge(vb.map, d, {}); if (!r) continue; var p = r.findIndex(function (x) { return x.sym === 'AAPL'; }); posA.push(p); }
var inR = posA.filter(function (p) { return p >= 0; }); inR.sort(function (a, b) { return a - b; });
console.log('AAPL: in Rangfolge an', inR.length, 'von', posA.length, 'Tagen; bester Rang', inR[0] + 1, 'schlechtester', inR[inR.length - 1] + 1, 'Median', inR[Math.floor(inR.length / 2)] + 1);
// Zahl der Signaltage und der Tage zwischen Entdeckung/Bestaetigung (2/3-Split der Achse)
console.log('Achse', vb.zeiten.length, 'Tage; 2/3-Split bei', vb.zeiten[Math.floor(vb.zeiten.length * 2 / 3)]);
// Autokorrelation: wie oft wechselt die Dezil-Zugehoerigkeit von Tag zu Tag (alle Symbole)?
var wechsel = 0, paare = 0, vorher = {};
for (var d = 0; d < vb.zeiten.length; d++) { var r = M.rangfolge(vb.map, d, {}); if (!r) continue; var n = Math.max(5, Math.round(r.length * 0.1)); var jetzt = {}; r.forEach(function (x, k) { jetzt[x.sym] = k < n ? 1 : (k >= r.length - n ? -1 : 0); }); Object.keys(jetzt).forEach(function (s) { if (vorher[s] !== undefined) { paare++; if (vorher[s] !== jetzt[s]) wechsel++; } }); vorher = jetzt; }
console.log('Dezil-Zugehoerigkeit wechselt an', wechsel, 'von', paare, 'Symbol-Tag-Paaren (' + (wechsel / paare * 100).toFixed(1) + ' %)');
