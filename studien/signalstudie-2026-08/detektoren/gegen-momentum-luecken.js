var fs = require('fs'); var MOM = require('./momentum.js'); var M = require('../../../momentum.js');
var DIR = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/'; var uni = {};
fs.readdirSync(DIR).filter(function (f) { return /^bars_60m_/.test(f); }).forEach(function (f) { uni[f.slice(9, -5)] = JSON.parse(fs.readFileSync(DIR + f, 'utf8')).series; });
var vb = MOM.vorbereiten(uni);
var klein = [];
for (var d = 0; d < vb.zeiten.length; d++) { var r = M.rangfolge(vb.map, d, {}); if (r && r.length < 100) klein.push([vb.zeiten[d], r.length, 'd-21=' + vb.zeiten[d - 21], 'd-252=' + vb.zeiten[d - 252]]); }
console.log('Signaltage mit < 100 Werten:', klein.length); console.log(JSON.stringify(klein.slice(0, 12)));
// Tage der Achse mit wenigen Kursen (Loecher im Archiv)
var luecken = [];
for (var d = 0; d < vb.zeiten.length; d++) { var n = 0; vb.syms.forEach(function (s) { if (vb.map[s][d] != null) n++; }); if (n < 100) luecken.push([vb.zeiten[d], n]); }
console.log('Achsentage mit < 100 Kursen:', JSON.stringify(luecken));
// Wochentage der Achse
var wt = {}; vb.zeiten.forEach(function (t) { var w = new Date(t + 'T12:00:00Z').getUTCDay(); wt[w] = (wt[w] || 0) + 1; }); console.log('Wochentage (0=So):', JSON.stringify(wt));
