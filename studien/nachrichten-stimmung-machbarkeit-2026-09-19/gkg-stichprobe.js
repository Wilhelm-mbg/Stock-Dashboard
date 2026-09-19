'use strict';
/* Machbarkeit Nachrichten-Stimmung (19.09.2026), §1.2: Stichprobe aus GDELT-GKG-2.1-Dateien (15-Minuten-Blöcke).
 * Zählt Zeilen, prüft Spalten, sucht Firmennamen in V2EnhancedOrganizations (Spalte 15, 1-basiert), gibt je Treffer
 * Stempel, Quelle, Ton (V1.5Tone, Spalte 16: Tone,Positive,Negative,Polarity,ARD,SGRD,WordCount), PAGE_PUBDATE und PAGE_TITLE
 * (aus V2ExtrasXML, Spalte 27). KEINE Bewertung einer Schlagzeile - nur Zuordnung und Zählung. Simulation, keine Anlageberatung.
 * Aufruf: node gkg-stichprobe.js <datei.csv> [<datei.csv> ...]  -> gkg-stichprobe.json im Studienordner */
var fs = require('fs'), path = require('path');
var NAMEN = { AAPL: ['apple inc', 'apple'], AAON: ['aaon'] };
var aus = { stand: new Date().toISOString(), dateien: [], zeilen: 0, spaltenMin: 99, spaltenMax: 0, mitOrganisation: 0, mitPubdate: 0, mitTitel: 0, ton: { n: 0, min: 99, max: -99, summe: 0 }, treffer: {} };
Object.keys(NAMEN).forEach(function (s) { aus.treffer[s] = { genau: 0, weit: 0, zeilen: [] }; });
function xmlFeld(x, tag) { var i = x.indexOf('<' + tag + '>'); if (i < 0) return null; var j = x.indexOf('</' + tag + '>', i); return j < 0 ? null : x.slice(i + tag.length + 2, j); }
process.argv.slice(2).forEach(function (f) {
  var txt = fs.readFileSync(f, 'latin1'), zeilen = txt.split('\n'), n = 0;
  zeilen.forEach(function (z) {
    if (!z) return; var c = z.split('\t'); n++;
    if (c.length < aus.spaltenMin) aus.spaltenMin = c.length; if (c.length > aus.spaltenMax) aus.spaltenMax = c.length;
    var org = (c[14] || ''), tone = (c[15] || '').split(','), extras = c[26] || '';
    if (org) aus.mitOrganisation++;
    var t = parseFloat(tone[0]); if (t === t) { aus.ton.n++; aus.ton.summe += t; if (t < aus.ton.min) aus.ton.min = t; if (t > aus.ton.max) aus.ton.max = t; }
    var pub = xmlFeld(extras, 'PAGE_PUBDATE'), titel = xmlFeld(extras, 'PAGE_TITLE');
    if (pub) aus.mitPubdate++; if (titel) aus.mitTitel++;
    var orgL = org.toLowerCase();
    Object.keys(NAMEN).forEach(function (s) {
      var genau = orgL.split(';').some(function (e) { return e.split(',')[0] === NAMEN[s][0]; });
      var weit = NAMEN[s].some(function (nm) { return orgL.indexOf(nm) >= 0; });
      if (genau) aus.treffer[s].genau++; if (weit) aus.treffer[s].weit++;
      if (weit && aus.treffer[s].zeilen.length < 20) aus.treffer[s].zeilen.push({ id: c[0], date: c[1], quelle: c[3], genau: genau,
        orgs: org.split(';').map(function (e) { return e.split(',')[0]; }).filter(function (e) { return e.indexOf(NAMEN[s][1]) >= 0; }).slice(0, 3).join('|'),
        tone: tone.slice(0, 4).join(','), pubdate: pub, titel: titel ? titel.slice(0, 90) : null });
    });
  });
  aus.dateien.push({ datei: path.basename(f), zeilen: n }); aus.zeilen += n;
});
aus.ton.mittel = aus.ton.n ? +(aus.ton.summe / aus.ton.n).toFixed(3) : null; delete aus.ton.summe;
fs.writeFileSync(path.join(__dirname, 'gkg-stichprobe.json'), JSON.stringify(aus, null, 1));
var kurz = JSON.parse(JSON.stringify(aus)); Object.keys(kurz.treffer).forEach(function (s) { kurz.treffer[s].zeilen = kurz.treffer[s].zeilen.slice(0, 20).map(function (z) { return [z.date, z.quelle, z.genau ? 'G' : 'w', z.orgs, z.tone, z.pubdate, z.titel].join(' | '); }); });
process.stdout.write(JSON.stringify(kurz, null, 1) + '\n');
