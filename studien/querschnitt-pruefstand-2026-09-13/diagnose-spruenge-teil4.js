'use strict';
/* DIAGNOSE (Teil 4, nachrichtlich): unbereinigte Kapitalmassnahmen im Panel. Gefunden ueber die Placebo-Diagnose:
 * GE 02.08.2021 (+675,6 %, Reverse-Split 1:8) und XRX 15.06.2017 (+300,4 %, Reverse-Split 1:4) tragen Faktor 1,0000 bei
 * gesetzter Marke MASSNAHME_NAH. Prueft: (1) Vorwaerts-Splits AAPL 4:1 (31.08.2020) und NVDA 10:1 (10.06.2024);
 * (2) alle Tageszeilen der Klassen 1-3 mit rendite >= +100 % oder <= -60 % (Sprungtage), nach Jahr und mit Marken;
 * (3) Test 1 (120 Tage) ohne GE in den Monaten, deren Fenster den 02.08.2021 enthaelt - wie stark hat der Sprung Delta bewegt.
 * Nichts wird repariert. Aufruf: node --max-old-space-size=6144 diagnose-spruenge-teil4.js --aus voll */
var fs = require('fs'), path = require('path');
var K = require('./konfig.js'), PR = require('./pruefstand.js'), T4 = require('./teil4.js');
var aus = process.argv[process.argv.indexOf('--aus') + 1] || 'voll';
var T = PR.Tafel(aus), g = T.g, out = { kennung: K.KONFIG_KENNUNG_TEIL4 + '/diagnose-spruenge', stand: new Date().toISOString() };
function zeile(name, iso) { var s = T.symIdx[name], t = T.kal.idx[iso], z = s === undefined || t === undefined ? -1 : T.zeileVon(s, t); return z < 0 ? null : { tag: iso, roh: g.rohSchluss[z], faktor: g.rohSchluss[z] / g.bSchluss[z], bSchluss: g.bSchluss[z], rendite: g.rendite[z], marken: g.marken[z] }; }
/* (1) Vorwaerts-Splits */
out.vorwaerts = { AAPL: ['2020-08-28', '2020-08-31', '2020-09-01'].map(function (d) { return zeile('AAPL', d); }), NVDA: ['2024-06-07', '2024-06-10', '2024-06-11'].map(function (d) { return zeile('NVDA', d); }),
  GE: ['2021-07-30', '2021-08-02'].map(function (d) { return zeile('GE', d); }), XRX: ['2017-06-14', '2017-06-15'].map(function (d) { return zeile('XRX', d); }) };
/* (2) Sprungtage in den Klassen 1-3 */
var spr = [], jeJahr = {};
for (var i = 0; i < g.n; i++) {
  var kl = g.klasse[i]; if (kl < 1 || kl > 3) continue;
  var r = g.rendite[i]; if (!(r >= 100 || r <= -60)) continue;
  var j = T.kal.tage[g.tag[i]].slice(0, 4); jeJahr[j] = (jeJahr[j] || 0) + 1;
  spr.push({ tag: T.kal.tage[g.tag[i]], kuerzel: T.symName[g.sym[i]], klasse: kl, rendite: r, faktor: g.rohSchluss[i] / g.bSchluss[i], marken: g.marken[i], massnahmeNah: !!(g.marken[i] & K.M_MASSNAHME_NAH) });
}
spr.sort(function (a, b) { return Math.abs(b.rendite) - Math.abs(a.rendite); });
out.sprungtage = { n: spr.length, mitMassnahmeMarke: spr.filter(function (s) { return s.massnahmeNah; }).length, faktorUngleichEins: spr.filter(function (s) { return Math.abs(s.faktor - 1) > 1e-9; }).length, jeJahr: jeJahr, top40: spr.slice(0, 40) };
/* (3) Test 1 ohne GE in den betroffenen Monaten */
var F = require(K.FUNDAMENTAL_LESER).oeffne(undefined, { maxAlterTage: K.TEIL4_FUNDAMENT_MAX_ALTER_TAGE });
var KL = K.UNIVERSUM_KLASSEN_TEIL3, H0 = K.TEIL4_HORIZONTE[0], tv = {}; K.EMPFINDLICHKEIT[0].totalverlust.forEach(function (x) { tv[x] = true; });
var sprungTag = T.kal.idx['2021-08-02'], ge = T.symIdx['GE'], P = [], Padj = [], Prob = [], betroffen = [], ausgeschlossen = 0, mitgliedMonate = 0;
/* Sprungtage je Reihe (alle 44, echte wie unbereinigte) fuer die Empfindlichkeit "ohne Sprungtage" */
var sprJeSym = {}; spr.forEach(function (s) { (sprJeSym[T.symIdx[s.kuerzel]] = sprJeSym[T.symIdx[s.kuerzel]] || []).push(T.kal.idx[s.tag]); });
function ohneSprung(liste, a, aE) { return liste.filter(function (e) { var l = sprJeSym[e.sym]; if (!l) return true; for (var q = 0; q < l.length; q++) if (l[q] >= a && l[q] <= aE) { ausgeschlossen++; return false; } return true; }); }
PR.signaltage(T, 'monat').forEach(function (t) {
  var U = PR.universum(T, t, { klassen: KL }); if (!U.liste.length || U.aTag === null) return;
  var sel = T4.auswahl(PR.Sicht(T, t, {}), U.liste, T, F, {}); if (!sel.ok) return;
  var aE = T4.periodenEnde(T, U.aTag, H0.tage); if (aE === null) return;
  var A = sel.liste.filter(function (e) { return e.istA; }), AB = A.filter(function (e) { return e.b === 1; }), AnB = A.filter(function (e) { return e.b === 0; });
  if (AB.length < K.TEIL4_MIN_JE_SEITE || AnB.length < K.TEIL4_MIN_JE_SEITE) return;
  var mIdx = T4.monatsIndex(T.kal.tage[U.aTag]);
  var c1 = T4.korb(T, AB, t, U.aTag, aE, tv), c2 = T4.korb(T, AnB, t, U.aTag, aE, tv), d = c1.netto - c2.netto;
  P.push({ mIdx: mIdx, dNetto: d });
  mitgliedMonate += AB.length + AnB.length;
  var ABr = ohneSprung(AB, U.aTag, aE), AnBr = ohneSprung(AnB, U.aTag, aE);
  if (ABr.length >= K.TEIL4_MIN_JE_SEITE && AnBr.length >= K.TEIL4_MIN_JE_SEITE) Prob.push({ mIdx: mIdx, dNetto: T4.korb(T, ABr, t, U.aTag, aE, tv).netto - T4.korb(T, AnBr, t, U.aTag, aE, tv).netto });
  var drin = U.aTag <= sprungTag && sprungTag <= aE, inAB = AB.some(function (e) { return e.sym === ge; }), inAnB = AnB.some(function (e) { return e.sym === ge; });
  if (drin && (inAB || inAnB)) {
    var AB2 = AB.filter(function (e) { return e.sym !== ge; }), AnB2 = AnB.filter(function (e) { return e.sym !== ge; });
    var d2 = T4.korb(T, AB2, t, U.aTag, aE, tv).netto - T4.korb(T, AnB2, t, U.aTag, aE, tv).netto;
    betroffen.push({ monat: T.kal.tage[U.aTag].slice(0, 7), seite: inAB ? 'AB' : 'AnB', dNetto: d, dNettoOhneGE: d2, wirkung: d - d2 });
    Padj.push({ mIdx: mIdx, dNetto: d2 });
  } else Padj.push({ mIdx: mIdx, dNetto: d });
});
var r0 = T4.reihe(P, 'dNetto', H0.lag), r1 = T4.reihe(Padj, 'dNetto', H0.lag), r2 = T4.reihe(Prob, 'dNetto', H0.lag);
out.test1OhneGE = { betroffeneMonate: betroffen, mit: { n: r0.n, mittel: r0.mittel, se: r0.se, t: r0.t, mde: r0.mde }, ohne: { n: r1.n, mittel: r1.mittel, se: r1.se, t: r1.t, mde: r1.mde }, wirkungAufMittel: r0.mittel - r1.mittel };
out.test1OhneSprungtage = { ausgeschlosseneMitgliedMonate: ausgeschlossen, mitgliedMonate: mitgliedMonate, n: r2.n, mittel: r2.mittel, se: r2.se, t: r2.t, mde: r2.mde, wirkungAufMittel: r0.mittel - r2.mittel };
process.stdout.write('Test 1 ohne alle Sprungtage: ' + ausgeschlossen + ' von ' + mitgliedMonate + ' Mitglied-Monaten ausgeschlossen; Mittel ' + r2.mittel.toFixed(4) + ' (t ' + r2.t.toFixed(2) + ', MDE ' + r2.mde.toFixed(3) + ')\n');
fs.writeFileSync(path.join(__dirname, 'diagnose-spruenge-teil4.json'), JSON.stringify(out, null, 1));
process.stdout.write('Vorwaerts-Splits: ' + JSON.stringify(out.vorwaerts.AAPL.map(function (z) { return z && [z.tag, z.roh.toFixed(2), z.faktor.toFixed(4), z.rendite.toFixed(1)]; })) + ' | NVDA ' + JSON.stringify(out.vorwaerts.NVDA.map(function (z) { return z && [z.tag, z.roh.toFixed(2), z.faktor.toFixed(4), z.rendite.toFixed(1)]; })) + '\n');
process.stdout.write('Sprungtage Klassen 1-3 (>= +100 % / <= -60 %): ' + spr.length + ', davon mit Massnahmen-Marke ' + out.sprungtage.mitMassnahmeMarke + ', Faktor != 1: ' + out.sprungtage.faktorUngleichEins + '; je Jahr ' + JSON.stringify(jeJahr) + '\n');
spr.slice(0, 20).forEach(function (s) { process.stdout.write('  ' + s.tag + ' ' + s.kuerzel + ' Kl ' + s.klasse + ' ' + s.rendite.toFixed(1) + ' % Faktor ' + s.faktor.toFixed(4) + ' Marken ' + s.marken + (s.massnahmeNah ? ' MASSNAHME_NAH' : '') + '\n'); });
process.stdout.write('Test 1 ohne GE: betroffen ' + betroffen.length + ' Monate ' + JSON.stringify(betroffen.map(function (b) { return b.monat + ' ' + b.seite + ' ' + b.wirkung.toFixed(2); })) + '; Mittel mit ' + r0.mittel.toFixed(4) + ' -> ohne ' + r1.mittel.toFixed(4) + ' (t ' + r0.t.toFixed(2) + ' -> ' + r1.t.toFixed(2) + ', MDE ' + r0.mde.toFixed(3) + ' -> ' + r1.mde.toFixed(3) + ')\n');
