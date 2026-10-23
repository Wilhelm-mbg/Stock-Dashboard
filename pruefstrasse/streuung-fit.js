'use strict';
/* Fit der Streuungstabelle (Auftrag Nr. 121-2a A.3) aus VERSIEGELTEN Protokollen, keine neuen Renditen:
 *   - pruefstrasse/erledigt/<k>/ergebnis.json (13 Konfigurationen, Entdeckung 2016-2022, se uNetto Hansen-Hodrick)
 *   - studien/vorregistrierung-2026-09-08-trendkanal-tage/ergebnis-2026-09-09/ergebnis.json (64 Konfigurationen; feste H = 48, "bruch" = 16
 *     mit variabler Dauer nur als Pruefpunkte; Teilzeitraeume entBis2020/entAb2021/bes als weitere Stuetzstellen fuer den Exponenten b)
 * Modell: ln se = alpha + gamma ln H - b ln n_T + delta ln d [topf] + zeta [zeit] + gammaZ ln H [zeit]   (d = Trades je Signaltag)
 * OLS in Logarithmen. Ausgeschlossen (Datenfehler der Quelle, sd je Tag > 20 Pp): wird gezaehlt und genannt.
 * Aufruf: node pruefstrasse/streuung-fit.js [<ausgabe, Vorgabe pruefstrasse/streuung.json>] [<bericht.md>]  (Nr. 121-2a; nur der PM fittet neu)
 * Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs'), path = require('path');
var REPO = path.resolve(__dirname, '..');
var ERL = path.join(REPO, 'pruefstrasse', 'erledigt');
var TK = path.join(REPO, 'studien', 'vorregistrierung-2026-09-08-trendkanal-tage', 'ergebnis-2026-09-09', 'ergebnis.json');
var ausJson = process.argv[2] || path.join(__dirname, 'streuung.json'), ausMd = process.argv[3];

var punkte = [], pruef = [], ausgeschlossen = [];
fs.readdirSync(ERL).sort().forEach(function (k) {
  var f = path.join(ERL, k, 'ergebnis.json'); if (!fs.existsSync(f)) return;
  var E = JSON.parse(fs.readFileSync(f, 'utf8')), modus = E.entdeckung.bewertung || 'topf';
  E.entdeckung.konfigurationen.forEach(function (c) {
    var e = c.entdeckung;
    punkte.push({ quelle: 'pruefstrasse', name: k + ' ' + c.key, H: c.haltedauer, n: e.nTage, d: e.nTr / e.nTage, modus: modus, se: e.uNetto.se, sd: null, periode: 'ent' });
  });
});
var T = JSON.parse(fs.readFileSync(TK, 'utf8'));
T.konf.forEach(function (k) {
  ['ent', 'entBis2020', 'entAb2021', 'bes'].forEach(function (p) {
    var e = k.alle[p]; if (!e || !e.uNetto || !(e.uNetto.se > 0)) return;
    var H = k.ausstieg === 'bruch' ? null : +k.ausstieg.slice(1);
    var pt = { quelle: 'trendkanal', name: k.linie + ' ' + k.einstieg + ' ' + k.richtung + ' ' + k.ausstieg, H: H, Hmittel: e.dauerMittel, n: e.nTage, d: e.nSig / e.nTage, modus: 'topf', se: e.uNetto.se, sd: e.uNetto.sd, periode: p };
    if (pt.sd > 20) { if (p === 'ent') ausgeschlossen.push(pt); return; }
    if (H == null) { if (p === 'ent') pruef.push(pt); return; }
    punkte.push(pt);
  });
});

/* OLS: X Spalten [1, lnH, -ln n, ln d * topf, zeit, lnH * zeit] */
/* bFest = null: b frei geschaetzt; sonst Spalte -ln n entfaellt und b ist gesetzt (y + bFest ln n) */
function zeile(p, bFest) { var z = p.modus === 'zeit' ? 1 : 0, x = [1, Math.log(p.H), -Math.log(p.n), (1 - z) * Math.log(p.d), z, z * Math.log(p.H)]; if (bFest != null) x.splice(2, 1); return x; }
function ols(P, bFest) {
  var X = P.map(function (p) { return zeile(p, bFest); }), y = P.map(function (p) { return Math.log(p.se) + (bFest != null ? bFest * Math.log(p.n) : 0); }), k = X[0].length;
  var A = [], b = [];
  for (var i = 0; i < k; i++) { A.push(new Array(k).fill(0)); b.push(0); }
  X.forEach(function (x, r) { for (var i = 0; i < k; i++) { b[i] += x[i] * y[r]; for (var j = 0; j < k; j++) A[i][j] += x[i] * x[j]; } });
  /* Gauss-Jordan */
  for (var c = 0; c < k; c++) {
    var piv = c; for (var r2 = c + 1; r2 < k; r2++) if (Math.abs(A[r2][c]) > Math.abs(A[piv][c])) piv = r2;
    var tmp = A[c]; A[c] = A[piv]; A[piv] = tmp; var tb = b[c]; b[c] = b[piv]; b[piv] = tb;
    for (var r3 = 0; r3 < k; r3++) { if (r3 === c) continue; var f = A[r3][c] / A[c][c]; for (var j2 = c; j2 < k; j2++) A[r3][j2] -= f * A[c][j2]; b[r3] -= f * b[c]; }
  }
  var beta = b.map(function (v, i) { return v / A[i][i]; });
  var res = P.map(function (p, r) { var x = X[r], yh = 0; for (var i = 0; i < k; i++) yh += x[i] * beta[i]; return y[r] - yh; });
  var s2 = res.reduce(function (s, e) { return s + e * e; }, 0) / (P.length - k);
  return { beta: beta, res: res, sdRes: Math.sqrt(s2) };
}
/* Entscheid (Uebergabe Nr. 121-2a): b frei geschaetzt und nachrichtlich; WIRKSAM ist b = 0,5 (Theorie 1/Wurzel n) - das freie b (> 0,5) entsteht
 * aus Zeitraeumen verschiedener Volatilitaet und wuerde beim Hochrechnen auf mehr Signaltage (braeuchte n, nBedarf, Wiedervorlage) die se zu
 * schnell fallen lassen (zu optimistisch). */
var B_WIRKSAM = 0.5;
var Ffrei = ols(punkte, null), Bf = Ffrei.beta;
var koefFrei = { alpha: Bf[0], gamma: Bf[1], b: Bf[2], delta: Bf[3], zeta: Bf[4], gammaZ: Bf[5] };
var F = ols(punkte, B_WIRKSAM), B = F.beta;
var koef = { alpha: B[0], gamma: B[1], b: B_WIRKSAM, delta: B[2], zeta: B[3], gammaZ: B[4] };
function seG(H, n, d, modus) { var z = modus === 'zeit' ? 1 : 0; return Math.exp(koef.alpha + koef.gamma * Math.log(H) - koef.b * Math.log(n) + (1 - z) * koef.delta * Math.log(d) + z * (koef.zeta + koef.gammaZ * Math.log(H))); }
/* Vergleich: b fest 0,5 (Theorie) - nur nachrichtlich */
var dRef = 50, HS = [1, 2, 3, 4, 5, 10, 20, 40, 60];
var tabelle = { topf: {}, zeit: {} };
HS.forEach(function (H) {
  tabelle.topf['H' + H] = Math.exp(koef.alpha + koef.gamma * Math.log(H) + koef.delta * Math.log(dRef));
  tabelle.zeit['H' + H] = Math.exp(koef.alpha + koef.zeta + (koef.gamma + koef.gammaZ) * Math.log(H));
});
var stuetz = punkte.map(function (p, i) { var g = seG(p.H, p.n, p.d, p.modus); return { quelle: p.quelle, name: p.name, periode: p.periode, H: p.H, nT: p.n, d: +p.d.toFixed(2), modus: p.modus, seIst: p.se, seGeschaetzt: g, faktor: p.se / g, residuumLn: F.res[i] }; });
var pruefPunkte = pruef.map(function (p) { var H = Math.max(1, Math.round(p.Hmittel)); var g = seG(H, p.n, p.d, 'topf'); return { name: p.name + ' (Dauer im Mittel ' + p.Hmittel.toFixed(1) + ')', H: H, nT: p.n, seIst: p.se, seGeschaetzt: g, faktor: p.se / g }; });
function q(arr, a) { var s = arr.slice().sort(function (x, y) { return x - y; }); return s[Math.min(s.length - 1, Math.max(0, Math.round(a * (s.length - 1))))]; }
var fk = stuetz.map(function (s) { return s.faktor; }), fk13 = stuetz.filter(function (s) { return s.quelle === 'pruefstrasse'; }).map(function (s) { return s.faktor; });
var J = {
  kennung: 'pruefstrasse/streuung/v1', stand: new Date().toISOString(),
  zweck: 'geschaetzter Standardfehler (Pp je Trade, Tagesmittel, Hansen-Hodrick) VOR einer Messung aus Zaehlungen (H, Signaltage n_T, Trades je Signaltag d, Bewertung) - Machbarkeitstor, Vorwaerts-Bedarf, Wiedervorlage (FORM.md §5). Nicht aus dem Kandidaten selbst.',
  modell: 'se = a_H(modus) * n_T^-b * (d / dRef)^delta (nur topf); a_H = exp(alpha + gamma ln H + delta ln dRef) (topf) bzw. exp(alpha + zeta + (gamma + gammaZ) ln H) (zeit); zwischen den Tabellen-H log-linear (gleich der Formel)',
  koeffizienten: koef, dRef: dRef, aH: tabelle, sdResiduumLn: F.sdRes,
  bFrei: { koeffizienten: koefFrei, sdResiduumLn: Ffrei.sdRes, hinweis: 'b frei geschaetzt (nachrichtlich); wirksam b = ' + B_WIRKSAM + ' fest' },
  quellen: ['pruefstrasse/erledigt/*/ergebnis.json (13 Konfigurationen, Entdeckung 2016-01-04 .. 2022-12-30)', 'studien/vorregistrierung-2026-09-08-trendkanal-tage/ergebnis-2026-09-09/ergebnis.json (48 Konfigurationen mit fester Haltedauer, Zeitraeume ent / entBis2020 / entAb2021 / bes)'],
  ausgeschlossen: ausgeschlossen.map(function (p) { return p.name + ' (sd je Tag ' + p.sd.toFixed(1) + ' Pp: Datenfehler der Quelle, alle vier Zeitraeume)'; }),
  faktorSeIstZuGeschaetzt: { alle: { n: fk.length, median: q(fk, 0.5), p10: q(fk, 0.1), p90: q(fk, 0.9), min: Math.min.apply(null, fk), max: Math.max.apply(null, fk) }, pruefstrasse13: { median: q(fk13, 0.5), min: Math.min.apply(null, fk13), max: Math.max.apply(null, fk13) } },
  stuetzstellen: stuetz, pruefpunkteBruch: pruefPunkte,
};
if (ausJson) fs.writeFileSync(ausJson, JSON.stringify(J, null, 1) + '\n');
var o = [];
o.push('b frei: ' + JSON.stringify(koefFrei, function (k, v) { return typeof v === 'number' ? +v.toFixed(4) : v; }) + ', sd Residuum (ln) ' + Ffrei.sdRes.toFixed(3));
o.push('Koeffizienten (wirksam, b fest ' + B_WIRKSAM + '): ' + JSON.stringify(koef, function (k, v) { return typeof v === 'number' ? +v.toFixed(4) : v; }) + ', sd Residuum (ln) ' + F.sdRes.toFixed(3) + ', Stuetzstellen ' + punkte.length);
o.push('a_H topf (d = ' + dRef + '): ' + HS.map(function (H) { return 'H' + H + ' ' + tabelle.topf['H' + H].toFixed(3); }).join(', '));
o.push('a_H zeit: ' + HS.map(function (H) { return 'H' + H + ' ' + tabelle.zeit['H' + H].toFixed(3); }).join(', '));
o.push('Faktor se_ist/se_geschaetzt alle: ' + JSON.stringify(J.faktorSeIstZuGeschaetzt));
o.push('Ausgeschlossen: ' + J.ausgeschlossen.join('; '));
o.push('');
o.push('| Stuetzstelle | Zeitraum | H | n_T | d | Modus | se ist | se geschaetzt | Faktor |');
o.push('|---|---|---|---|---|---|---|---|---|');
stuetz.filter(function (s) { return s.quelle === 'pruefstrasse' || s.periode === 'ent'; }).forEach(function (s) { o.push('| ' + s.name + ' | ' + s.periode + ' | ' + s.H + ' | ' + s.nT + ' | ' + s.d + ' | ' + s.modus + ' | ' + s.seIst.toFixed(4) + ' | ' + s.seGeschaetzt.toFixed(4) + ' | ' + s.faktor.toFixed(2) + ' |'); });
o.push('');
o.push('Pruefpunkte bruch (nicht im Fit): ' + pruefPunkte.map(function (p) { return p.name + ' ' + p.faktor.toFixed(2); }).join('; '));
if (ausMd) fs.writeFileSync(ausMd, o.join('\n') + '\n');
console.log(o.slice(0, 5).join('\n'));
