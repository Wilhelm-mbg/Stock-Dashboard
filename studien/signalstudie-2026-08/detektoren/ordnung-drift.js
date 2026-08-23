'use strict';
/* Haengt das Signal von der Reihenfolge der Symbole im Universum ab? zuordnen() vergleicht
 * ein Ereignis nur mit frueheren Array-Eintraegen; gleichtaegige Ereignisse liegen je
 * nach Schluesselreihenfolge davor oder dahinter. */
const { lade } = require('./lade.js');
const D = require('./drift.js');
const v = lade();
const AB = Date.parse('2022-01-01T00:00:00Z');
const k1 = {}, k2 = {}, t1 = {}, t2 = {};
const syms = Object.keys(v.kursMap);
syms.forEach(s => { k1[s] = v.kursMap[s].filter(b => b[0] >= AB); t1[s] = v.termine[s]; });
syms.slice().reverse().forEach(s => { k2[s] = k1[s]; t2[s] = t1[s]; });
const markt = v.markt.filter(b => b[0] >= AB);
const a = D.signalTabelle(k1, t1, markt), b = D.signalTabelle(k2, t2, markt);
let n = 0, diff = 0, bsp = [];
const alle = new Set();
[a, b].forEach(t => Object.keys(t).forEach(s => Object.keys(t[s]).forEach(d => alle.add(s + '|' + d))));
alle.forEach(k => { const [s, d] = k.split('|'); n++; const x = (a[s] || {})[d] || 0, y = (b[s] || {})[d] || 0; if (x !== y) { diff++; if (bsp.length < 6) bsp.push(s + ' ' + d + ' ' + x + '/' + y); } });
console.log('Signale (Vereinigung beider Reihenfolgen):', n, '| verschieden bei umgekehrter Symbolreihenfolge:', diff, bsp.join(', '));
