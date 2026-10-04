'use strict';
/* M1 - aus dem Cache (je CIK ein Auszug aller 8-K-Formen ab 2016) den Auszug der Meldungen mit Punkt 2.02 bauen und zaehlen.
 *
 *   node auszug.js     -> meldungen-202.tsv (cik, akzession, annahme, filingDate, reportDate, form, items) + zaehlung-m1.json
 *
 * Liest nur den eigenen Cache und `_reihen.json` der Bilanz-Tafel. Kein Netz, keine Kurse.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var AB = require('./abruf.js');
var Zt = require('./zeit.js');

function main() {
  var M = JSON.parse(fs.readFileSync(path.join(K.TAFEL, '_reihen.json'), 'utf8'));
  var ciks = Object.keys(M.ciks).map(Number).sort(function (a, b) { return a - b; });
  /* frueheste erste Kerze je CIK (ueber alle ihre Reihen) - fuer "CIK juenger als die Reihe" */
  var erster = {}, lebend = {};
  Object.keys(M.reihen).forEach(function (s) {
    var r = M.reihen[s]; if (!r.cik) return;
    if (!erster[r.cik] || r.erster < erster[r.cik]) erster[r.cik] = r.erster;
    if (r.lebend) lebend[r.cik] = 1;
  });
  var z = { stand: new Date().toISOString(), tafelKennung: M.kennung, firmen: ciks.length, mitAntwort: 0, ohneListe404: 0, offen: 0, offenBeispiele: [],
    firmenMit8K: 0, firmenMit202: 0, firmenMit202Lebend: 0, firmenMit202Verschwunden: 0, zeilen8K: 0, zeilen202: 0,
    form: {}, jeJahr: {}, mitAnnahmezeit: 0, ohneAnnahmezeit: 0, punkte: { allein: 0, mit901: 0, mit701: 0, mitAnderen: 0 },
    cikJuengerAlsReihe: 0, cikJuengerBeispiele: [], feldFehlt: 0, doppelteAkzessionUeberFirmen: 0, einreichungenGesehen: 0, zusatzdateienGeholt: 0 };
  var zeilen = [], akz = {};
  ciks.forEach(function (cik) {
    var p = path.join(K.CACHE_CIK, AB.cik10(cik) + '.json');
    if (!fs.existsSync(p)) { z.offen++; if (z.offenBeispiele.length < 10) z.offenBeispiele.push(cik); return; }
    var e = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (e.fehlt) { z.ohneListe404++; return; }
    z.mitAntwort++;
    z.einreichungenGesehen += e.nGesehen || 0;
    z.zusatzdateienGeholt += (e.dateien || []).filter(function (d) { return d.geholt; }).length;
    if (Object.keys(e.feldFehlt || {}).length) z.feldFehlt++;
    var start = erster[cik] && erster[cik] > K.VON ? erster[cik] : K.VON;
    if (e.aelteste && Date.parse(e.aelteste) - Date.parse(start) > 90 * 86400000) { z.cikJuengerAlsReihe++; if (z.cikJuengerBeispiele.length < 8) z.cikJuengerBeispiele.push({ cik: cik, name: e.name, aeltesteEinreichung: e.aelteste, ersteKerze: erster[cik] }); }
    var k = e.k8 || [], n202 = 0;
    if (k.length) z.firmenMit8K++;
    z.zeilen8K += k.length;
    k.forEach(function (r) {
      if (!AB.hat202(r.i)) return;
      n202++;
      z.form[r.f] = (z.form[r.f] || 0) + 1;
      var j = r.d.slice(0, 4); z.jeJahr[j] = z.jeJahr[j] || { alle: 0, form8K: 0, mitAnnahmezeit: 0 };
      z.jeJahr[j].alle++; if (r.f === '8-K') z.jeJahr[j].form8K++;
      if (Zt.FORM.test(r.t || '')) { z.mitAnnahmezeit++; z.jeJahr[j].mitAnnahmezeit++; } else z.ohneAnnahmezeit++;
      var it = String(r.i).split(',').filter(function (x) { return x !== '2.02'; });
      if (!it.length) z.punkte.allein++;
      else if (it.length === 1 && it[0] === '9.01') z.punkte.mit901++;
      else if (it.every(function (x) { return x === '9.01' || x === '7.01'; })) z.punkte.mit701++;
      else z.punkte.mitAnderen++;
      if (akz[r.a]) z.doppelteAkzessionUeberFirmen++; else akz[r.a] = 1;
      zeilen.push([cik, r.a, r.t || '', r.d, r.r || '', r.f, r.i].join('\t'));
    });
    if (n202) { z.firmenMit202++; if (lebend[cik]) z.firmenMit202Lebend++; else z.firmenMit202Verschwunden++; }
  });
  z.zeilen202 = zeilen.length;
  var text = 'cik\takzession\tannahme\tfilingDate\treportDate\tform\titems\n' + zeilen.join('\n') + '\n';
  fs.writeFileSync(path.join(__dirname, 'meldungen-202.tsv'), text);
  z.auszugBytes = Buffer.byteLength(text);
  fs.writeFileSync(path.join(__dirname, 'zaehlung-m1.json'), JSON.stringify(z, null, 1));
  process.stdout.write(JSON.stringify(z, null, 1) + '\n');
}

/** Auszug lesen -> [{cik, a, t, d, r, f, i}] */
function lies(pfad) {
  var a = fs.readFileSync(pfad || path.join(__dirname, 'meldungen-202.tsv'), 'utf8').split('\n'), aus = [];
  for (var i = 1; i < a.length; i++) {
    if (!a[i]) continue;
    var s = a[i].split('\t');
    aus.push({ cik: +s[0], a: s[1], t: s[2], d: s[3], r: s[4], f: s[5], i: s[6] });
  }
  return aus;
}

module.exports = { lies: lies };
if (require.main === module) main();
