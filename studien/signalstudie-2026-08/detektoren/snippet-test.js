var fs = require('fs'), DIR = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var universum60m = {}; fs.readdirSync(DIR).filter(function (f) { return /^bars_60m_/.test(f); }).forEach(function (f) { universum60m[f.slice(9, -5)] = JSON.parse(fs.readFileSync(DIR + f, 'utf8')).series; });
// ---- Snippet Anfang ----
var MOM = require('C:/Users/Wilhe/AppData/Local/Temp/claude/C--Users-Wilhe-AppData-Local-Programs-markt-dashboard/5d59645f-0547-4aec-912b-09c638f04c24/scratchpad/detektoren/momentum.js');
var vb = MOM.vorbereiten(universum60m);            // einmal je Lauf; universum60m = {SYM: bars60m}, Krypto wird intern verworfen
function signal(bars, i, params) {                 // params = {sym: 'NVDA'}; feuert nur am ersten 60m-Bar eines Handelstages
  var s = MOM.momentumSignal(bars, i, { sym: params.sym, vb: vb, rueckblick: 231, luecke: 21, anteil: 0.10, minWerte: 25 });
  return s ? { dir: s.dir } : null;               // +1 = staerkstes Zehntel (belegt, long), -1 = schwaechstes Zehntel (unbelegt)
}
// ---- Snippet Ende ----
var b = universum60m.NVDA, n = 0, bsp = null;
for (var i = 1; i < b.length; i++) { var s = signal(b, i, { sym: 'NVDA' }); if (s) { n++; if (!bsp) bsp = [MOM.nyTag(b[i][0]), s]; } }
console.log('NVDA Signale:', n, 'erstes:', JSON.stringify(bsp));
var tot = { '+1': 0, '-1': 0 }, tage = new Set();
vb.syms.forEach(function (sy) { var bb = universum60m[sy]; for (var i = 1; i < bb.length; i++) { var s = signal(bb, i, { sym: sy }); if (s) { tot[s.dir > 0 ? '+1' : '-1']++; tage.add(MOM.nyTag(bb[i][0])); } } });
console.log('Gesamt ueber', vb.syms.length, 'Aktien:', JSON.stringify(tot), 'Signaltage:', tage.size);
