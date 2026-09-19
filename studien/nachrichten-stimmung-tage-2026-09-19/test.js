'use strict';
/* Prüfungen zur Vorregistrierung Nachrichten-Stimmung, Tagesdesign (Nr. 45). Kunstfälle, kein Panel, kein Netz.
 * Aufruf: node studien/nachrichten-stimmung-tage-2026-09-19/test.js */
var fs = require('fs'), path = require('path');
var S = require('./signal.js'), KONST = require('./konstanten.js');
var K = require(path.join(__dirname, '..', 'querschnitt-pruefstand-2026-09-13', 'konfig.js'));
var n = 0, rot = 0;
function ok(bed, was) { n++; if (!bed) { rot++; process.stdout.write('ROT  ' + was + '\n'); } }
function wirft(fn) { try { fn(); return false; } catch (e) { return /Leck/.test(e.message); } }
function nah(a, b, eps) { return Math.abs(a - b) <= (eps || 1e-9); }
var TAG = { iso: '2025-07-15', dateien: 96 }, TAG_W = { iso: '2025-01-15', dateien: 96 };
function art(stempel, ton) { return { stempel: stempel, ton: ton == null ? 1 : ton }; }

/* ---- P1 Leck-Klinke: Stempel t+1 wirft, 16:00 ET ist die Grenze, Sommer- und Winterzeit ---- */
ok(wirft(function () { S.tagesSignal([art('20250715120000'), art('20250715130000'), art('20250716120000')], TAG); }), 'P1a Artikel vom 16.07. wirft für t = 15.07.');
var s1b = S.tagesSignal([art('20250701030000')], { iso: '2025-06-30', dateien: 96 });
ok(s1b.spaet === 1 && s1b.ton === null, 'P1b 01.07. 03:00 UTC = 30.06. 23:00 EDT: Tag t, spät, kein Leck');
ok(wirft(function () { S.tagesSignal([art('20250701043000')], { iso: '2025-06-30', dateien: 96 }); }), 'P1c 01.07. 04:30 UTC = 01.07. 00:30 EDT: Leck für t = 30.06.');
var sommer = S.tagesSignal([art('20250715200000'), art('20250715195959'), art('20250715200001'), art('20250715120000')], TAG);
ok(sommer.n === 3 && sommer.spaet === 1, 'P1d Sommer: 20:00:00 UTC = 16:00:00 EDT zählt, 20:00:01 UTC ist spät (n ' + sommer.n + ', spät ' + sommer.spaet + ')');
var winter = S.tagesSignal([art('20250115210000'), art('20250115210001'), art('20250115200000'), art('20250115120000')], TAG_W);
ok(winter.n === 3 && winter.spaet === 1, 'P1e Winter: 21:00:00 UTC = 16:00:00 EST zählt, 21:00:01 UTC ist spät (n ' + winter.n + ')');
var fremd = S.tagesSignal([art('20250714120000'), art('20250715120000'), art('20250715130000'), art('20250715140000')], TAG);
ok(fremd.fremd === 1 && fremd.n === 3 && fremd.ton !== null, 'P1f Artikel vom Vortag zählt als fremd, kein Leck');
ok(!wirft(function () { S.tagesSignal([], TAG); }) && S.tagesSignal([], TAG).ton === null, 'P1g leere Liste: undefiniert, kein Wurf');
var bad = false; try { S.stempelET('2025-07-15'); } catch (e) { bad = true; } ok(bad, 'P1h Stempel im falschen Format wirft');

/* ---- P2 Signal undefiniert: < 3 Artikel, Block-Ausfall, < 50 % Dateien ---- */
var zwei = S.tagesSignal([art('20250715120000', 2), art('20250715130000', 4)], TAG);
ok(zwei.ton === null && zwei.n === 2 && /artikel</.test(zwei.grund), 'P2a zwei Artikel: undefiniert');
var drei = S.tagesSignal([art('20250715120000', 2), art('20250715130000', 4), art('20250715140000', 6)], TAG);
ok(nah(drei.ton, 4) && drei.grund === null, 'P2b drei Artikel: Mittel 4');
var block = S.tagesSignal([art('20250620120000', 2), art('20250620130000', 4), art('20250620140000', 6)], { iso: '2025-06-20', dateien: 96 });
ok(block.ton === null && block.grund === 'block-ausfall' && block.n === 3, 'P2c Block-Ausfall 20.06.2025: undefiniert trotz 3 Artikeln (n gezählt)');
ok(S.tagUndefiniert({ iso: '2025-06-15', dateien: 96 }) === 'block-ausfall' && S.tagUndefiniert({ iso: '2025-07-01', dateien: 96 }) === 'block-ausfall', 'P2d Block-Ränder 15.06. und 01.07. eingeschlossen');
ok(S.tagUndefiniert({ iso: '2025-07-02', dateien: 96 }) === null && S.tagUndefiniert({ iso: '2025-06-14', dateien: 96 }) === null, 'P2e 14.06. und 02.07. sind keine Blocktage');
ok(S.tagUndefiniert({ iso: '2025-07-15', dateien: 47 }) !== null && S.tagUndefiniert({ iso: '2025-07-15', dateien: 48 }) === null, 'P2f 47 Dateien undefiniert, 48 definiert');
ok(S.tagUndefiniert({ iso: '2025-07-15' }) !== null, 'P2g fehlende Dateizahl: undefiniert, nicht stillschweigend definiert');

/* ---- P3 Rang je Tag: invariant gegen Niveau und Skalierung, null bleibt null, Gleichstand nach Name ---- */
var w = { A: -1.2, B: 0.4, C: 2.5, D: null, E: 0.4, F: NaN };
var r0 = S.rangJeTag(w), r1 = {}, r2 = {};
Object.keys(w).forEach(function (s) { r1[s] = typeof w[s] === 'number' ? w[s] + 7.5 : w[s]; r2[s] = typeof w[s] === 'number' ? w[s] * 3 : w[s]; });
ok(JSON.stringify(S.rangJeTag(r1)) === JSON.stringify(r0), 'P3a Rang invariant gegen +7,5');
ok(JSON.stringify(S.rangJeTag(r2)) === JSON.stringify(r0), 'P3b Rang invariant gegen ×3');
ok(r0.D === null && r0.F === null && r0.A === 0 && r0.C === 1, 'P3c null/NaN bleiben null, Extreme 0 und 1');
ok(r0.B < r0.E && nah(r0.B, 1 / 3) && nah(r0.E, 2 / 3), 'P3d Gleichstand B = E nach Name geordnet');
ok(S.rangJeTag({ X: 3 }).X === 0.5, 'P3e ein Wert: 0,5');
var geg = S.rangJeTag({ A: 1, B: 2, C: 3 }); ok(geg.A === 0 && geg.B === 0.5 && geg.C === 1, 'P3f Gegenprobe drei Werte 0 / 0,5 / 1');

/* ---- P4 Änderung gegen das 20-Tage-Mittel ---- */
var vt = []; for (var i = 0; i < 25; i++) vt.push(i < 5 ? 100 : 1);            /* die 5 alten Ausreißer liegen außerhalb der 20 */
ok(nah(S.aenderung(2, vt), 1), 'P4a nur die letzten 20 definierten Vortage zählen');
ok(S.aenderung(2, vt.slice(0, 9).map(function () { return 1; })) === null, 'P4b 9 Vortage: undefiniert');
ok(nah(S.aenderung(2, vt.slice(0, 10).map(function () { return 1; })), 1), 'P4c 10 Vortage: definiert');
ok(S.aenderung(2, [1, null, 1, null, 1, 1, 1, 1, 1, 1, 1, 1]) !== null && S.aenderung(2, [1, null, 1, null, 1, 1, 1, 1, 1, 1, 1]) === null, 'P4d undefinierte Vortage zählen nicht mit');
ok(S.aenderung(null, vt) === null, 'P4e heute undefiniert: Änderung undefiniert');

/* ---- P5 Kosten je Umlauf aus EINER Stelle ---- */
ok(S.kostenJeUmlauf(2) === K.huerdeVon(2) && S.kostenJeUmlauf(2) === K.KLASSEN[2].huerde, 'P5a Kl. 2 = konfig.js (' + S.kostenJeUmlauf(2) + ')');
ok(S.kostenJeUmlauf(3) === K.huerdeVon(3) && K.KLASSEN[3].name === 'ab1000' && K.KLASSEN[2].name === '250-1000', 'P5b Kl. 3 = ab1000, Kl. 2 = 250-1000');
var quell = fs.readFileSync(path.join(__dirname, 'konstanten.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'signal.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'vorpruefung.js'), 'utf8');
ok(!/0[.,]064[0-9]|0[.,]044[0-9]|0[.,]085[0-9]|0[.,]156|0[.,]157/.test(quell.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'P5c keine Hürdenzahl im Code der Studie (nur in Kommentaren)');
ok(KONST.KLASSEN.length === 2 && KONST.KLASSEN[0] === 2 && KONST.KLASSEN[1] === 3, 'P5d Universum Klassen 2 und 3');

/* ---- P6 Schwelle t ≥ 3 ist strenger als Bonferroni über 12 Tests (eigene erf-Näherung) ---- */
function erfc(x) { var z = Math.abs(x), t = 1 / (1 + 0.5 * z); var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return x >= 0 ? r : 2 - r; }
function Phi(x) { return 1 - 0.5 * erfc(x / Math.SQRT2); }
function PhiInv(p) { var lo = 0, hi = 8; for (var k = 0; k < 80; k++) { var m = (lo + hi) / 2; if (Phi(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
var zBonf12 = PhiInv(1 - 0.05 / (2 * KONST.TESTZAHL));
ok(zBonf12 > 2.86 && zBonf12 < 2.87 && KONST.T_SCHWELLE > zBonf12, 'P6a z_Bonf(12) = ' + zBonf12.toFixed(3) + ' < 3');
ok(nah(PhiInv(0.80), 0.8416, 2e-4) && nah(KONST.MDE_FAKTOR_T3, 3.8416) && nah(KONST.MDE_FAKTOR, 2.8016), 'P6b z_0,80 = 0,8416; MDE-Faktoren 3,8416 / 2,8016');
ok(nah(PhiInv(1 - 0.05 / 4), 2.2414, 2e-4), 'P6c Gegenprobe z_Bonf(2) = 2,2414 wie Teil 4');

/* ---- P7 Vorprüfung: Nullpunkt (Zufallsdezil-Mittel ≈ 0), MDE = Faktor × se, Hürden aus dem Lauf ---- */
var pfad = path.join(__dirname, 'vorpruefung.json');
if (!fs.existsSync(pfad)) { ok(false, 'P7 vorpruefung.json fehlt — erst vorpruefung.js laufen lassen'); }
else {
  var V = JSON.parse(fs.readFileSync(pfad, 'utf8')), zellen = 0, nullOk = true, mdeOk = true, huOk = true;
  function nullpunkt(z) { return Math.abs(z.mittel) / z.se < KONST.NULLPUNKT_MAX_T; }
  ['2', '3', '23'].forEach(function (k) {
    var t = V.tafel[k];
    KONST.HALTEDAUERN.forEach(function (H) {
      var h = t.haltedauer[H];
      [h.dezilUni, h.ls].forEach(function (z) { if (z.duenn) return; zellen++; if (!nullpunkt(z)) nullOk = false; if (!nah(z.mde80, KONST.MDE_FAKTOR * z.se) || !nah(z.mde80x4, 4 * z.mde80) || !nah(z.mde80Bonf, KONST.MDE_FAKTOR_T3 * z.se)) mdeOk = false; });
      if (!nah(h.noetigBruttoLongUni, t.huerdeJeUmlauf) || !nah(h.noetigBruttoLS, 2 * t.huerdeJeUmlauf)) huOk = false;
    });
  });
  ok(zellen === 18, 'P7a 18 Zellen (3 Gruppen × 3 H × 2 Portfolios), gefunden ' + zellen);
  ok(nullOk, 'P7b Nullpunkt: |Mittel| / se < 3 in jeder Zelle');
  ok(!nullpunkt({ mittel: 5, se: 1 }) && nullpunkt({ mittel: 0.1, se: 1 }), 'P7c Positivkontrolle: der Nullpunkt-Test kann ablehnen');
  ok(mdeOk, 'P7d MDE80 = 2,8016 × se, ×4, und 3,8416 × se in jeder Zelle');
  ok(huOk && nah(V.tafel[2].huerdeJeUmlauf, K.huerdeVon(2)) && nah(V.tafel[3].huerdeJeUmlauf, K.huerdeVon(3)), 'P7e nötige Bruttokante = Hürde (Long-Uni) bzw. 2 × Hürde (L-S), Klassenhürden aus konfig');
  var hu23 = V.tafel[23].huerdeJeUmlauf; ok(hu23 > K.huerdeVon(3) && hu23 < K.huerdeVon(2), 'P7f Mischhürde gepoolt liegt zwischen den Klassenhürden (' + hu23.toFixed(4) + ')');
  ok(V.kennung === KONST.KENNUNG_VORPRUEFUNG && V.saat === KONST.SAAT_VORPRUEFUNG && V.haltedauern.join() === KONST.HALTEDAUERN.join() && V.klassen.join() === KONST.KLASSEN.join(), 'P7g Kennung, Saat, Haltedauern, Klassen aus konstanten.js');
  ok(V.tafel[2].tage >= 2000 && V.zaehler.signaltage >= 2400 && V.fenster[0] === KONST.FENSTER_VON, 'P7h tägliche Signaltage 2017–2026 (' + V.zaehler.signaltage + ')');
  var m1 = V.tafel[2].haltedauer[1].dezilUni, m5 = V.tafel[2].haltedauer[5].dezilUni;
  ok(m5.sd > m1.sd && m5.sd < 3 * m1.sd, 'P7i Streuung wächst mit der Haltedauer, aber unter Faktor 3 (√5 = 2,24 erwartet): ' + (m5.sd / m1.sd).toFixed(2));
}

process.stdout.write((rot ? rot + ' von ' + n + ' ROT' : n + ' Prüfungen grün') + '\n');
process.exit(rot ? 1 : 0);
