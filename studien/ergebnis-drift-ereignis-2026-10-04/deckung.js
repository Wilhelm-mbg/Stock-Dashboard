'use strict';
/* Deckung je Umsatzklasse (blind, nur Zaehlungen): wie viele Universumsmitglieder eines Stichtags haben im Kalenderjahr
 * mindestens eine Meldung 2.02 ihrer Firma im Auszug - und woran scheitert der Rest (keine CIK, CIK ohne 2.02-Meldung,
 * Fonds/ETF ohne Quartalsmeldung)?      node --max-old-space-size=6144 deckung.js [JJJJ-MM-TT ...]  -> deckung.json
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var AZ = require('./auszug.js');
var PK = require(path.join(K.PRUEFSTAND, 'konfig.js'));
var PS = require(path.join(K.PRUEFSTAND, 'pruefstand.js'));

var M = JSON.parse(fs.readFileSync(path.join(K.TAFEL, '_reihen.json'), 'utf8'));
function cikVon(sym) { var r = M.reihen[sym] || M.reihen[String(sym).replace(/~2$/, '')]; return r && r.cik ? r.cik : null; }   /* wie der Leser der Tafel */
var jeCikJahr = {};
AZ.lies().forEach(function (m) { if (m.f === '8-K') jeCikJahr[m.cik + '|' + m.d.slice(0, 4)] = 1; });
var T = PS.Tafel(K.PANEL_AUS), tage = process.argv.slice(2);
if (!tage.length) tage = ['2018-06-01', '2021-06-01', '2024-06-03', '2026-06-01'];
var aus = { stand: new Date().toISOString(), stichtage: [] };
tage.forEach(function (iso) {
  var t = T.kal.idx[iso], U = PS.universum(T, t, { klassen: K.KLASSEN_ALLE }), jahr = iso.slice(0, 4), je = {};
  U.liste.forEach(function (e) {
    var kn = PK.KLASSEN[e.klasse].name, o = je[kn] || (je[kn] = { mitglieder: 0, ohneCik: 0, cikOhneMeldungImJahr: 0, mitMeldungImJahr: 0, artOhneMeldung: {}, beispieleOhne: [] });
    var name = T.symName[e.sym], cik = cikVon(name), art = T.stand.symbole[e.sym].art;
    o.mitglieder++;
    if (cik && jeCikJahr[cik + '|' + jahr]) { o.mitMeldungImJahr++; return; }
    if (!cik) o.ohneCik++; else o.cikOhneMeldungImJahr++;
    o.artOhneMeldung[art] = (o.artOhneMeldung[art] || 0) + 1;
    if (o.beispieleOhne.length < 25) o.beispieleOhne.push(name + (cik ? '' : '*'));
  });
  aus.stichtage.push({ stichtag: iso, klassen: je });
  Object.keys(je).forEach(function (kn) {
    var o = je[kn];
    process.stdout.write(iso + ' ' + kn + ': Mitglieder ' + o.mitglieder + ', mit Meldung im Jahr ' + o.mitMeldungImJahr + ', ohne CIK ' + o.ohneCik + ', CIK ohne Meldung ' + o.cikOhneMeldungImJahr +
      ', Art ' + JSON.stringify(o.artOhneMeldung) + (kn === 'ab1000' || kn === '250-1000' ? ' | ohne (Stern = keine CIK): ' + o.beispieleOhne.join(' ') : '') + '\n');
  });
});
fs.writeFileSync(path.join(__dirname, 'deckung.json'), JSON.stringify(aus, null, 1));
