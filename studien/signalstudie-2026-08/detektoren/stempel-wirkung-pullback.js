/* Wirkung der In-Sitzungs-Stempel (08-19, off-grid, vol 0) auf Pullback-Signale:
 * Signale (Zeitstempel, Richtung) an 08-19..08-21 mit Pruefer-Filter (Mo-Fr, m<390)
 * vs. zusaetzlich nur Raster-Kerzen (t % 5min == 0). */
var fs = require('fs');
var Q = require('../../../quant.js');
var dir = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
function sig(bars, i) {
  var win = bars.slice(Math.max(0, i - 260), i + 1);
  var s = Q.pullbackSignal(win, 'ema', 20, 15);
  return s.signal === 'call' ? 1 : s.signal === 'put' ? -1 : null;
}
function sess(b) { var d = new Date(b[0]); var wt = d.getUTCDay(); var m = Q.minutenSeitOeffnung(b[0]); return wt >= 1 && wt <= 5 && m >= 0 && m < 390; }
var files = fs.readdirSync(dir).filter(function (f) { return /^bars_5m_/.test(f); });
var nurA = 0, nurB = 0, beide = 0, symN = 0, stempelSig = 0;
files.forEach(function (f) {
  var raw = JSON.parse(fs.readFileSync(dir + f, 'utf8')).series;
  if (!raw.some(function (b) { return b[0] % 300000 !== 0; })) return;
  symN++;
  var A = raw.filter(sess), B = raw.filter(function (b) { return sess(b) && b[0] % 300000 === 0; });
  function sigs(bars) { var o = {}; for (var i = 0; i < bars.length; i++) { var iso = new Date(bars[i][0]).toISOString().slice(0, 10); if (iso < '2026-08-19') continue; var s = sig(bars, i); if (s != null) o[bars[i][0] + '|' + s] = bars[i][0] % 300000 !== 0; } return o; }
  var sa = sigs(A), sb = sigs(B);
  Object.keys(sa).forEach(function (k) { if (sb[k] !== undefined) beide++; else { nurA++; if (sa[k]) stempelSig++; } });
  Object.keys(sb).forEach(function (k) { if (sa[k] === undefined) nurB++; });
});
console.log('Symbole mit Stempeln=' + symN, 'Signale 19.-21.08.: gemeinsam=' + beide, 'nur mit Stempeln=' + nurA + ' (davon AUF einer Stempel-Kerze=' + stempelSig + ')', 'nur ohne Stempel=' + nurB);
['1m', '15m'].forEach(function (iv) {
  var ms = iv === '1m' ? 60000 : 900000, fl = fs.readdirSync(dir).filter(function (f) { return f.indexOf('bars_' + iv + '_') === 0; });
  var off = 0, tot = 0, sy = 0; fl.forEach(function (f) { var s = JSON.parse(fs.readFileSync(dir + f, 'utf8')).series; var o = 0; s.forEach(function (b) { tot++; if (b[0] % ms !== 0) { off++; o++; } }); if (o) sy++; });
  console.log(iv + ': Dateien=' + fl.length + ' Kerzen=' + tot + ' offGrid=' + off + ' Symbole=' + sy);
});
