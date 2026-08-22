'use strict';
/* Gegenpruefung Donchian: Archivformat, Null-Verhalten, erschoepfende Praefix-Probe, Snippet vs. Live. */
var fs = require('fs');
var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';

// 1) Archivformat aller 5m-Dateien
var files = fs.readdirSync(STORE).filter(function (f) { return /^bars_5m_/.test(f); });
var fmt = { dateien: files.length, kurzZeilen: 0, nullHL: 0, erstZeileKurz: [], gemischt: [], nullHLDateien: [] };
files.forEach(function (f) {
  var s;
  try { s = JSON.parse(fs.readFileSync(STORE + f, 'utf8')).series; } catch (e) { return; }
  if (!s || !s.length) return;
  var kurz = 0, nl = 0;
  s.forEach(function (b) { if (b.length < 5) kurz++; else if (b[3] == null || b[4] == null) nl++; });
  fmt.kurzZeilen += kurz; fmt.nullHL += nl;
  if (s[0].length < 5) fmt.erstZeileKurz.push(f);
  if (kurz && kurz !== s.length) fmt.gemischt.push(f + ':' + kurz + '/' + s.length);
  if (nl) fmt.nullHLDateien.push(f + ':' + nl);
});
console.log('FORMAT', JSON.stringify(fmt));

// 2) Null-Verhalten der Funktion (synthetisch)
var base = []; for (var k = 0; k < 40; k++) base.push([k * 300000, 100, 1000, 100.5, 99.5]);
var a = base.map(function (b) { return b.slice(); }); a[38][3] = null; a[38][4] = null; a[39][1] = 100; // Schluss unveraendert
var b = base.map(function (b) { return b.slice(); }); b[30][3] = null; b[30][4] = null; b[39][1] = 90;  // klarer Put-Ausbruch
console.log('NULL-TEST letzte Fensterbar null, Schluss 100 (kein Ausbruch erwartet):', JSON.stringify(Q.donchianSignal(a, 20, 15)));
console.log('NULL-TEST Fensterbar null, Schluss 90 (put erwartet):', JSON.stringify(Q.donchianSignal(b, 20, 15)));

// 3) Erschoepfende Praefix-Probe (JEDER Index, inkl. Reihenende) auf 3 Symbolen + Zufall auf 10 weiteren
function mulberry32(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(4711);
var P = { period: 20, confirmBps: 15 };
function snippet(bars, i, params) {
  var N = (params && params.period) || 20, conf = params && params.confirmBps !== undefined ? params.confirmBps : 15;
  if (i < N + 9) return null;
  var s = Q.donchianSignal(bars.slice(i - N - 9, i + 1), N, conf).signal;
  return s === 'call' ? { dir: 1 } : s === 'put' ? { dir: -1 } : null;
}
function liveForm(barsBisI) { var s = Q.donchianSignal(barsBisI, P.period, P.confirmBps).signal; return s === 'call' ? { dir: 1 } : s === 'put' ? { dir: -1 } : null; }
function str(s) { return s ? String(s.dir) : 'null'; }
var ex = { symbole: ['AAPL', 'MSFT', 'NVDA'], geprueft: 0, abw: 0, endeGeprueft: 0, sig: { '1': 0, '-1': 0, 'null': 0 } };
ex.symbole.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_5m_' + sym + '.json', 'utf8')).series;
  for (var i = 29; i < bars.length; i++) {
    var voll = snippet(bars, i, P), prae = snippet(bars.slice(0, i + 1), i, P), live = liveForm(bars.slice(0, i + 1));
    ex.geprueft++; if (i >= bars.length - 50) ex.endeGeprueft++;
    ex.sig[str(voll)]++;
    if (str(voll) !== str(prae) || str(voll) !== str(live)) { ex.abw++; if (ex.abw < 5) console.log('ABW', sym, i, str(voll), str(prae), str(live)); }
  }
});
console.log('ERSCHOEPFEND', JSON.stringify(ex));
var weitere = files.map(function (f) { return f.replace(/^bars_5m_|\.json$/g, ''); }).filter(function (s) { return ex.symbole.indexOf(s) === -1; });
var zf = { symbole: [], geprueft: 0, abw: 0 };
for (var w = 0; w < 10 && weitere.length; w++) {
  var sym2 = weitere.splice(Math.floor(rnd() * weitere.length), 1)[0];
  var bars2 = JSON.parse(fs.readFileSync(STORE + 'bars_5m_' + sym2 + '.json', 'utf8')).series;
  if (bars2.length < 60) continue;
  zf.symbole.push(sym2);
  for (var q = 0; q < 100; q++) {
    var i2 = 29 + Math.floor(rnd() * (bars2.length - 29));
    if (q < 10) i2 = bars2.length - 1 - q;   // Reihenende ausdruecklich
    var v2 = snippet(bars2, i2, P), p2 = snippet(bars2.slice(0, i2 + 1), i2, P), l2 = liveForm(bars2.slice(0, i2 + 1));
    zf.geprueft++; if (str(v2) !== str(p2) || str(v2) !== str(l2)) zf.abw++;
  }
}
console.log('ZUFALL10', JSON.stringify(zf));

// 4) Snippet auf 2 Symbolen: Signale vorhanden? Vergleich mit Live-Form (alle Bars bis i)
['AMZN', 'TSLA'].forEach(function (sym) {
  var f = STORE + 'bars_5m_' + sym + '.json'; if (!fs.existsSync(f)) { console.log('fehlt', sym); return; }
  var bars = JSON.parse(fs.readFileSync(f, 'utf8')).series;
  var c = 0, p = 0, d = 0;
  for (var i = 29; i < bars.length; i++) {
    var s = snippet(bars, i, P); if (s && s.dir === 1) c++; if (s && s.dir === -1) p++;
    if (str(s) !== str(liveForm(bars.slice(0, i + 1)))) d++;
  }
  console.log('SNIPPET', sym, 'bars', bars.length, 'call', c, 'put', p, 'abwLive', d);
});
