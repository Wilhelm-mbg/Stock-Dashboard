'use strict';
/* Rueckwirkende Urteile der 13 Konfigurationen nach den Regeln von Nr. 121-2a, OFFLINE aus den versiegelten Protokollen (kein Neulauf, keine neuen
 * Renditen): Machbarkeitstor (Zaehlungen n_T, d aus dem Protokoll), Kandidatenkriterium, Groessenaussage, Wiedervorlage. Reihenfolge wie im Register
 * (m sequentiell: nicht messbar zaehlt 0). Ausgabe Markdown auf stdout und JSON in argv[2]. Aufruf: node pruefstrasse/rueckwirkung-2a.js [<aus.json>].
 * Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs'), path = require('path');
var R = path.join(__dirname, '/');
var K = require(R + 'konfig.js'), TO = require(R + 'tore.js');
var Rg = JSON.parse(fs.readFileSync(R + 'register.json', 'utf8'));
var reihenfolge = []; Rg.konfigurationen.forEach(function (e) { if (reihenfolge.indexOf(e.kennung) === -1) reihenfolge.push(e.kennung); });
var mBisher = 0, zeilen = [];
function f(x, n) { return x == null ? '–' : x.toFixed(n == null ? 3 : n).replace('.', ','); }
reihenfolge.forEach(function (kn) {
  var E = JSON.parse(fs.readFileSync(R + 'erledigt/' + kn + '/ergebnis.json', 'utf8')), kand = JSON.parse(fs.readFileSync(R + 'warteschlange/' + kn + '/kandidat.json', 'utf8'));
  if (!E.entdeckung || E.entdeckung.machbarkeit) return;              /* nur Messungen vor Nr. 121-2a (ohne Machbarkeitstor) */
  var konf = E.entdeckung.konfigurationen, modus = E.entdeckung.bewertung || 'topf', TE = E.entdeckung.TE, mTor = mBisher + konf.length, ende = E.entdeckung.letzterTag;
  var je = konf.map(function (k) {
    var e = k.entdeckung, er = TO.erwartungFuer(kand, k.key), sj = e.nTage / TE * 252;
    var M = TO.machbarkeit({ H: k.haltedauer, nT: e.nTage, d: e.tradesJeTag || e.nTr / e.nTage, modus: modus, nettoPp: er.nettoPp, m: mTor, signaltageJeJahr: sj });
    if (M.messbar && e.nTage < K.MIN_TAGE) M.messbar = false;
    return { k: k, e: e, er: er, M: M, sj: sj };
  });
  var messbar = je.filter(function (x) { return x.M.messbar; }), mLauf = mBisher + messbar.length;
  je.forEach(function (x) {
    var k = x.k, e = x.e, neu, kandidat = false, schwelle = null, wv = null, g = TO.groessenAussage(e.uBrutto.obere, x.er.bruttoPp, x.er.fensterWieQuelle);
    if (!x.M.messbar) neu = 'nicht messbar';
    else {
      schwelle = TO.kandidatSchwelle(Math.max(1, e.uNetto.nEff - 1), mLauf);
      kandidat = e.uNetto.mittel > 0 && e.uNetto.t >= schwelle.t && e.nTage >= K.MIN_TAGE && !(k.placebo && k.placebo.verstoss);
      neu = kandidat ? 'Kandidat -> vorgemerkt' : (e.uNetto.obere < 0 && e.nTage >= K.MIN_TAGE) ? 'nein' : 'nicht entscheidbar';
      if (neu === 'nicht entscheidbar') wv = TO.wiedervorlage({ H: k.haltedauer, nT: e.nTage, d: e.tradesJeTag || e.nTr / e.nTage, modus: modus, nettoPp: x.er.nettoPp, signaltageJeJahr: x.sj, ab: ende });
    }
    zeilen.push({ kennung: kn, key: k.key, H: k.haltedauer, modus: modus, nT: e.nTage, d: e.tradesJeTag || e.nTr / e.nTage, nettoPp: x.er.nettoPp, bruttoPp: x.er.bruttoPp, seIst: e.uNetto.se, seGeschaetzt: x.M.seGeschaetzt,
      mTor: mTor, tKritTor: x.M.tKrit, links: x.M.links, messbar: x.M.messbar, braeuchte: x.M.braeuchteSignaltage, braeuchteJahre: x.M.braeuchteSignaltage != null ? x.M.braeuchteSignaltage / x.sj : null,
      t: e.uNetto.t, mLauf: x.M.messbar ? mLauf : null, tSchwelle: schwelle ? schwelle.t : null, kandidat: kandidat, obereBrutto: e.uBrutto.obere, groesse: g, alt: k.urteil, neu: neu, wiedervorlage: wv });
  });
  mBisher += messbar.length;
});
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(zeilen, null, 1));
console.log('| Kennung | Konf | Modus | n_T | se ist / geschaetzt | Behauptung netto (brutto) | m (Tor) | t_krit | (t_krit + 0,84) x se_g | Machbarkeit | braeuchte n (≈ Jahre) | t_E | Schwelle (m) | Groessenaussage (obere brutto) | alt -> neu | Wiedervorlage |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
zeilen.forEach(function (z) {
  console.log('| ' + z.kennung + ' | ' + z.key + ' | ' + z.modus + ' | ' + z.nT + ' | ' + f(z.seIst) + ' / ' + f(z.seGeschaetzt) + ' | ' + f(z.nettoPp, 2) + ' (' + f(z.bruttoPp, 2) + ') | ' + z.mTor + ' | ' + f(z.tKritTor, 2) + ' | ' + f(z.links) + ' | ' + (z.messbar ? 'messbar' : '**nicht messbar**') + ' | ' +
    (z.messbar ? '–' : z.braeuchte + ' (' + f(z.braeuchteJahre, 0) + ')') + ' | ' + f(z.t, 2) + ' | ' + (z.tSchwelle ? f(z.tSchwelle, 2) + ' (' + z.mLauf + ')' : '–') + ' | ' + (z.groesse ? z.groesse + ' (' + f(z.obereBrutto) + ' < ' + f(z.bruttoPp, 2) + ')' : 'nein (' + f(z.obereBrutto) + ')') + ' | ' + z.alt + ' -> ' + z.neu + ' | ' + (z.wiedervorlage ? (z.wiedervorlage.datum || '–') : '–') + ' |');
});
var nm = zeilen.filter(function (z) { return !z.messbar; }).length, ka = zeilen.filter(function (z) { return z.kandidat; }).length, gr = zeilen.filter(function (z) { return z.groesse; }).length;
console.log('\n' + nm + ' von ' + zeilen.length + ' nicht messbar, ' + ka + ' Kandidaten, Groessenaussage bei ' + gr + ' Konfigurationen.');
