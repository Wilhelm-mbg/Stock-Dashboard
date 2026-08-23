'use strict';
const fs = require('fs');
const ST = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
function lade() {
  const kursMap = {};
  for (let t = 0; t < 8; t++) Object.assign(kursMap, JSON.parse(fs.readFileSync(ST + 'mf_tagesdaten_teil_' + t + '.json', 'utf8')).roh);
  const markt = JSON.parse(fs.readFileSync(ST + 'drift_markt.json', 'utf8')).reihe;
  const archiv = JSON.parse(fs.readFileSync(ST + 'drift_termine.json', 'utf8'));
  const termine = {};
  Object.keys(kursMap).forEach(s => { if (archiv.sym[s] && archiv.sym[s].length) termine[s] = archiv.sym[s]; });
  return { kursMap, markt, termine };
}
module.exports = { lade, ST };
