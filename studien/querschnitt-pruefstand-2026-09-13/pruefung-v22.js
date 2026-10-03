'use strict';
/* PRUEFUNG v2.2 (Auftrag Nr. 67, 03.10.2026) - Kernpruefung des Luecken-Neubaus: Panel A (v2.1, voll/) gegen Panel B Zeile fuer
 * Zeile ueber den Schluessel (Kuerzel-Basis, Tag).
 *
 * WAS GEPRUEFT WIRD
 *   1. Liste: luecken-trennungen.json gegen den Trockenlauf luecken-kandidaten.json - dieselben Reihen und Tage, die Zahl der
 *      Zeilen, die die Reihe wechseln, aus dem Trockenlauf VORAB gerechnet (Summe zeilenNach der ersten Luecke je Reihe).
 *   2. Jede Zeile von A ist in B (und umgekehrt). Unterschiede sind nur erlaubt als
 *        (a) Reihenname: Zeile liegt in B in einer Luecken-Nachfolgereihe, deren reiheV21 der Name in A ist,
 *        (b) rendite: genau an der ersten Zeile einer Luecken-Nachfolgereihe (B nicht endlich),
 *        (c) klasse: in den ersten K.UMSATZ_FENSTER Zeilen einer Luecken-Nachfolgereihe (davon die ersten K.UMSATZ_MIN_TAGE = -1),
 *            marken: KEINE_RENDITE an der ersten Zeile der neuen Reihe, LETZTER_TAG an der letzten Zeile vor der Luecke.
 *      Alles andere zaehlt als UNERKLAERT. kerzen, rohSchluss, rohEroeffnung, faktor, renditeOC, umsatzReg, umsatzAuktion
 *      muessen BITgleich sein (Vergleich der Bitmuster, nicht der Zahlen).
 *   3. Gegenprobe der Wirkung, gezaehlt wie im Trockenlauf §7: Reihen-Tage eines Universumsmitglieds (Klasse 1-3, >= 250 Zeilen
 *      Vorlauf, 2017-2026) mit einer Luecke > K.LUECKE_TRENN_TAGE zwischen zwei seiner letzten 252 Zeilen. A muss die Zahl des
 *      Trockenlaufs treffen (Eichung des Zaehlers), B muss 0 liefern.
 *   --erwartung gleich: B ist OHNE --luecken gebaut (Rueckwaerts-Probe) - dann ist JEDER Unterschied unerklaert.
 *   --teilmenge: B enthaelt nur einige Reihen (--reihen); verglichen werden die Kuerzel, die in B Zeilen haben.
 *
 * Aufruf: node --max-old-space-size=8192 pruefung-v22.js --b voll-v22 [--a voll] [--erwartung luecken|gleich] [--teilmenge]
 *                                                        [--aus pruefung-v22.json]
 * NUR LESEN auf den Panels. Rueckgabewert 0 = bestanden, 1 = nicht bestanden.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var P = require('./paneldaten.js');
var TR = require('./kuerzelwechsel.js');

var A = { a: 'voll', b: null, erwartung: 'luecken', teilmenge: false, aus: path.join(__dirname, 'pruefung-v22.json') };
for (var ai = 2; ai < process.argv.length; ai++) {
  var x = process.argv[ai];
  if (x === '--a') A.a = process.argv[++ai];
  else if (x === '--b') A.b = process.argv[++ai];
  else if (x === '--erwartung') A.erwartung = process.argv[++ai];
  else if (x === '--teilmenge') A.teilmenge = true;
  else if (x === '--aus') A.aus = process.argv[++ai];
}
if (!A.b) { process.stderr.write('--b <ordner> fehlt\n'); process.exit(2); }
var t0 = Date.now(), kal = K.kalender(), TAGMS = kal.tage.map(function (t) { return Date.parse(t + 'T00:00:00Z'); });
var WIRK = { minVortage: K.MIN_VORTAGE, fensterZeilen: 252, klassen: [1, 2, 3], jahrVon: 2017, jahrBis: 2026 };
function sag(s) { process.stdout.write(s + '\n'); }

/* ---------- 1. Liste gegen den Trockenlauf ---------- */
var LT = TR.lueckenLaden(), KA = JSON.parse(fs.readFileSync(path.join(__dirname, 'luecken-kandidaten.json'), 'utf8'));
var lA = LT.trennungen.map(function (t) { return t.reihe + '@' + t.letzterVor + '>' + t.tag + '#' + t.tage; }).sort();
var lB = KA.kandidaten.map(function (k) { return k.reihe + '@' + k.letzterVor + '>' + k.ersterNach + '#' + k.tage; }).sort();
var wechselSoll = 0; KA.kandidaten.forEach(function (k) { if (k.lueckeNrDerReihe === 1) wechselSoll += k.zeilenNach; });
var liste = { trennungen: LT.trennungen.length, reihen: LT.zaehler.reihen, basisKuerzel: LT.zaehler.basisKuerzel, trockenlauf: KA.kandidaten.length,
  gleichDemTrockenlauf: lA.length === lB.length && lA.every(function (v, i) { return v === lB[i]; }),
  zeilenWechselnAusTrockenlauf: wechselSoll, zeilenWechselnListe: LT.zaehler.zeilenWechseln, nummerAb3: LT.zaehler.nummerAb3, bisTag: LT.bisTag };
liste.ok = liste.gleichDemTrockenlauf && wechselSoll === LT.zaehler.zeilenWechseln && LT.trennungen.length === KA.zaehler.luecken && LT.zaehler.reihen === KA.zaehler.reihen;
sag('Liste: ' + liste.trennungen + ' Trennungen in ' + liste.reihen + ' Reihen, gleich dem Trockenlauf: ' + liste.gleichDemTrockenlauf + ', Zeilenwechsel Soll ' + wechselSoll);

/* ---------- Panels laden und flach legen ---------- */
function lade(ordner) {
  var p = P.ladePanel(ordner), jahre = Object.keys(p.jahre).sort(), N = 0;
  jahre.forEach(function (j) { N += p.jahre[j].n; });
  var g = P.leer(N), off = 0;
  jahre.forEach(function (j) { var b = p.jahre[j]; P.SPALTEN.forEach(function (s) { g[s.name].set(b[s.name].subarray(0, b.n), off); }); off += b.n; p.jahre[j] = null; });
  var nSym = p.stand.symbole.length, pos = new Int32Array(N), anz = new Int32Array(nSym), letzte = new Int32Array(nSym).fill(-1);
  for (var i = 0; i < N; i++) { var s = g.sym[i]; if (letzte[s] >= 0 && g.tag[i] <= g.tag[letzte[s]]) throw new Error(ordner + ': Tage der Reihe ' + p.stand.symbole[s].reihe + ' nicht aufsteigend'); pos[i] = anz[s]++; letzte[s] = i; }
  return { ordner: ordner, stand: p.stand, g: g, N: N, nSym: nSym, pos: pos, anz: anz, letzte: letzte, name: p.stand.symbole.map(function (r) { return r.reihe; }) };
}
var PA = lade(A.a); sag('A ' + A.a + ': ' + PA.N + ' Zeilen, ' + PA.nSym + ' Reihen, Kennung ' + PA.stand.kennung);
var PB = lade(A.b); sag('B ' + A.b + ': ' + PB.N + ' Zeilen, ' + PB.nSym + ' Reihen, Kennung ' + PB.stand.kennung);

/* ---------- Luecken und Wirkung je Panel (ein Durchlauf in Panelordnung) ---------- */
function wirkung(X, nurBasis) {
  var vor = new Int32Array(X.nSym).fill(-1), lgp = new Int32Array(X.nSym).fill(-1);
  var z = { lueckenUeberSchwelle: 0, reihenMitLuecke: 0, kurzluecken: 0, betroffeneReihenTage: 0, universumReihenTage: 0, betroffeneReihen: {} }, hat = new Uint8Array(X.nSym);
  for (var i = 0; i < X.N; i++) {
    var s = X.g.sym[i], t = X.g.tag[i];
    if (nurBasis && !nurBasis[TR.basisVon(X.name[s])]) continue;
    if (vor[s] >= 0) {
      var d = Math.round((TAGMS[t] - TAGMS[vor[s]]) / 86400000);
      if (d > K.LUECKE_TRENN_TAGE) { z.lueckenUeberSchwelle++; lgp[s] = X.pos[i]; if (!hat[s]) { hat[s] = 1; z.reihenMitLuecke++; } }
      else if (d >= 30) z.kurzluecken++;
    }
    vor[s] = t;
    var jahr = +kal.tage[t].slice(0, 4);
    if (X.pos[i] >= WIRK.minVortage && WIRK.klassen.indexOf(X.g.klasse[i]) !== -1 && jahr >= WIRK.jahrVon && jahr <= WIRK.jahrBis) {
      z.universumReihenTage++;
      if (lgp[s] >= 0 && X.pos[i] - lgp[s] <= WIRK.fensterZeilen - 2) { z.betroffeneReihenTage++; z.betroffeneReihen[X.name[s]] = (z.betroffeneReihen[X.name[s]] || 0) + 1; }
    }
  }
  return z;
}

/* ---------- 2. Zeile fuer Zeile ueber (Basis, Tag) ---------- */
var basisId = {}, nBasis = 0;
function bid(name) { var b = TR.basisVon(name); if (basisId[b] === undefined) basisId[b] = nBasis++; return basisId[b]; }
var bA = PA.name.map(bid), bB = PB.name.map(bid);
var basisInB = {}, inB = new Uint8Array(nBasis);
for (var q = 0; q < PB.N; q++) inB[bB[PB.g.sym[q]]] = 1;
Object.keys(basisId).forEach(function (b) { if (inB[basisId[b]]) basisInB[b] = 1; });
var SCHL = 4096; if (kal.tage.length > SCHL) throw new Error('Kalender laenger als der Schluesselraum');
var idxA = new Int32Array(nBasis * SCHL).fill(-1), doppeltA = 0, doppeltB = 0;
for (q = 0; q < PA.N; q++) { var ka = bA[PA.g.sym[q]] * SCHL + PA.g.tag[q]; if (idxA[ka] >= 0) doppeltA++; idxA[ka] = q; }
function bits32(a) { return new Uint32Array(a.buffer, a.byteOffset, a.length); }
function bits64(a) { return new Uint32Array(a.buffer, a.byteOffset, a.length * 2); }
var BIT = { rohSchluss: [bits64(PA.g.rohSchluss), bits64(PB.g.rohSchluss), 2], rohEroeffnung: [bits64(PA.g.rohEroeffnung), bits64(PB.g.rohEroeffnung), 2],
  faktor: [bits64(PA.g.faktor), bits64(PB.g.faktor), 2], renditeOC: [bits32(PA.g.renditeOC), bits32(PB.g.renditeOC), 1],
  umsatzReg: [bits32(PA.g.umsatzReg), bits32(PB.g.umsatzReg), 1], umsatzAuktion: [bits32(PA.g.umsatzAuktion), bits32(PB.g.umsatzAuktion), 1] };
var rA = bits32(PA.g.rendite), rB = bits32(PB.g.rendite), BITNAMEN = Object.keys(BIT);
var symB = PB.stand.symbole, gesehenA = new Uint8Array(PA.N), gesehenKey = new Uint8Array(nBasis * SCHL);
var Z = { gemeinsam: 0, nurInB: 0, fehltInB: 0, nameWechsel: 0, neueReihenMitZeilen: {}, renditeErsteZeile: 0, klasseUnreif: 0, klasseFensterNeu: 0,
  markeKeineRendite: 0, markeLetzterTag: 0, unerklaert: 0, unerklaertJeArt: {}, ersteZeilenNeuerReihen: 0, ersteZeilenRenditeInAEndlich: 0 };
var UNERKL = [];
function unerklaert(art, i, j, a, b) {
  Z.unerklaert++; Z.unerklaertJeArt[art] = (Z.unerklaertJeArt[art] || 0) + 1;
  if (UNERKL.length < 60) UNERKL.push({ art: art, reiheA: j >= 0 ? PA.name[PA.g.sym[j]] : null, reiheB: i >= 0 ? PB.name[PB.g.sym[i]] : null, tag: kal.tage[i >= 0 ? PB.g.tag[i] : PA.g.tag[j]], a: a, b: b });
}
for (var i = 0; i < PB.N; i++) {
  var sb = PB.g.sym[i], kb = bB[sb] * SCHL + PB.g.tag[i], j = idxA[kb];
  if (gesehenKey[kb]) doppeltB++; gesehenKey[kb] = 1;
  if (j < 0) { Z.nurInB++; unerklaert('nurInB', i, -1, null, PB.g.rohSchluss[i]); continue; }
  gesehenA[j] = 1; Z.gemeinsam++;
  var eb = symB[sb], neu = A.erwartung === 'luecken' && !!eb.luecke, erste = neu && PB.pos[i] === 0;
  var vorLuecke = A.erwartung === 'luecken' && eb.ende_grund === K.ENDE_GRUND_LUECKE && PB.letzte[sb] === i;
  var na = PA.name[PA.g.sym[j]], nb = PB.name[sb];
  if (na !== nb) {
    if (neu && eb.luecke.reiheV21 === na) { Z.nameWechsel++; Z.neueReihenMitZeilen[nb] = 1; } else unerklaert('reihenname', i, j, na, nb);
  } else if (neu) unerklaert('nachfolgerMitAltemNamen', i, j, na, nb);
  if (erste) { Z.ersteZeilenNeuerReihen++; if (PA.g.rendite[j] === PA.g.rendite[j]) Z.ersteZeilenRenditeInAEndlich++; if (PB.g.rendite[i] === PB.g.rendite[i]) unerklaert('ersteZeileMitRendite', i, j, PA.g.rendite[j], PB.g.rendite[i]); }
  if (rA[j] !== rB[i]) { if (erste && !(PB.g.rendite[i] === PB.g.rendite[i])) Z.renditeErsteZeile++; else unerklaert('rendite', i, j, PA.g.rendite[j], PB.g.rendite[i]); }
  if (PA.g.klasse[j] !== PB.g.klasse[i]) {
    if (neu && PB.pos[i] < K.UMSATZ_MIN_TAGE && PB.g.klasse[i] === -1) Z.klasseUnreif++;
    else if (neu && PB.pos[i] >= K.UMSATZ_MIN_TAGE && PB.pos[i] < K.UMSATZ_FENSTER) Z.klasseFensterNeu++;
    else unerklaert('klasse', i, j, PA.g.klasse[j], PB.g.klasse[i]);
  } else if (neu && PB.pos[i] < K.UMSATZ_MIN_TAGE && PB.g.klasse[i] !== -1) unerklaert('klasseNichtNeuBegonnen', i, j, PA.g.klasse[j], PB.g.klasse[i]);
  var dm = PA.g.marken[j] ^ PB.g.marken[i];
  if (dm) {
    var erlaubt = (erste ? K.M_KEINE_RENDITE : 0) | (vorLuecke ? K.M_LETZTER_TAG : 0);
    if ((dm & ~erlaubt) || (dm & PA.g.marken[j])) unerklaert('marken', i, j, PA.g.marken[j], PB.g.marken[i]);
    else { if (dm & K.M_KEINE_RENDITE) Z.markeKeineRendite++; if (dm & K.M_LETZTER_TAG) Z.markeLetzterTag++; }
  }
  if (vorLuecke && !(PB.g.marken[i] & K.M_LETZTER_TAG)) unerklaert('letzterTagFehlt', i, j, PA.g.marken[j], PB.g.marken[i]);
  if (PA.g.kerzen[j] !== PB.g.kerzen[i]) unerklaert('kerzen', i, j, PA.g.kerzen[j], PB.g.kerzen[i]);
  for (var c = 0; c < BITNAMEN.length; c++) {
    var B3 = BIT[BITNAMEN[c]], w = B3[2];
    if (B3[0][j * w] !== B3[1][i * w] || (w === 2 && B3[0][j * w + 1] !== B3[1][i * w + 1])) unerklaert(BITNAMEN[c], i, j, PA.g[BITNAMEN[c]][j], PB.g[BITNAMEN[c]][i]);
  }
}
var zeilenAVerglichen = 0;
for (q = 0; q < PA.N; q++) {
  if (A.teilmenge && !inB[bA[PA.g.sym[q]]]) continue;
  zeilenAVerglichen++;
  if (!gesehenA[q]) { Z.fehltInB++; unerklaert('fehltInB', -1, q, PA.g.rohSchluss[q], null); }
}
Z.neueReihenMitZeilen = Object.keys(Z.neueReihenMitZeilen).length;

/* ---------- 3. Wirkung und Luecken ---------- */
var wA = wirkung(PA, A.teilmenge ? basisInB : null), wB = wirkung(PB, null);
var wAganz = A.teilmenge ? wirkung(PA, null) : wA;
function kurzW(w) { var r = Object.keys(w.betroffeneReihen).map(function (n) { return [n, w.betroffeneReihen[n]]; }).sort(function (x1, y1) { return y1[1] - x1[1]; });
  return { lueckenUeberSchwelle: w.lueckenUeberSchwelle, reihenMitLuecke: w.reihenMitLuecke, kurzluecken3090: w.kurzluecken, betroffeneReihenTage: w.betroffeneReihenTage,
    universumReihenTage: w.universumReihenTage, betroffeneReihen: r.length, groesste: r.slice(0, 20).map(function (e) { return e[0] + ' ' + e[1]; }) }; }

/* ---------- Soll und Urteil ---------- */
var wechselSollHier = 0, neueSollHier = 0;
LT.trennungen.forEach(function (t) { if (A.teilmenge && !basisInB[t.basis]) return; neueSollHier++; if (t.vorAbschnitt === t.reihe) wechselSollHier += t.zeilenNach; });
var zs = PB.stand.zaehler || {}, gruende = [];
function muss(ok, text) { if (!ok) gruende.push(text); }
muss(liste.ok, 'Liste weicht vom Trockenlauf ab');
muss(doppeltA === 0 && doppeltB === 0, 'Schluessel (Basis, Tag) nicht eindeutig: A ' + doppeltA + ', B ' + doppeltB);
muss(Z.unerklaert === 0, Z.unerklaert + ' unerklaerte Unterschiede');
muss(Z.fehltInB === 0 && Z.nurInB === 0, 'Zeilen fehlen (' + Z.fehltInB + ') oder sind nur in B (' + Z.nurInB + ')');
if (A.erwartung === 'gleich') {
  muss(Z.nameWechsel === 0 && Z.renditeErsteZeile === 0 && Z.klasseUnreif + Z.klasseFensterNeu === 0 && Z.markeKeineRendite + Z.markeLetzterTag === 0, 'Rueckwaerts-Probe: B ist nicht bitgleich mit A');
  muss(PB.stand.kennung === K.PANEL_KENNUNG, 'Kennung von B ist nicht ' + K.PANEL_KENNUNG);
} else {
  muss(PB.stand.kennung === K.PANEL_KENNUNG_V22, 'Kennung von B ist nicht ' + K.PANEL_KENNUNG_V22);
  muss(Z.nameWechsel === wechselSollHier, 'Zeilenwechsel ' + Z.nameWechsel + ' statt ' + wechselSollHier);
  muss(Z.neueReihenMitZeilen === neueSollHier, 'neue Reihen ' + Z.neueReihenMitZeilen + ' statt ' + neueSollHier);
  muss(Z.ersteZeilenNeuerReihen === neueSollHier && Z.markeLetzterTag === neueSollHier, 'erste Zeilen / LETZTER_TAG: ' + Z.ersteZeilenNeuerReihen + ' / ' + Z.markeLetzterTag + ' statt ' + neueSollHier);
  muss(wB.lueckenUeberSchwelle === 0, 'B hat noch ' + wB.lueckenUeberSchwelle + ' Luecken ueber der Schwelle in einer Reihe');
  muss(wB.betroffeneReihenTage === 0, 'Wirkung in B: ' + wB.betroffeneReihenTage + ' Reihen-Tage statt 0');
  muss((zs.lueckenUngetrennt || 0) === 0 && (zs.trennungAbweichung || 0) === 0, 'Bau-Zaehler: ungetrennt ' + zs.lueckenUngetrennt + ', Abweichungen ' + zs.trennungAbweichung);
  if (!A.teilmenge) {
    muss(wechselSollHier === wechselSoll && Z.nameWechsel === KA.wirkung.trennung.alleUeber90.zeilenWechseln, 'Zeilenwechsel trifft die Zahl des Trockenlaufs nicht');
    muss(wA.betroffeneReihenTage === KA.wirkung.summe && wA.universumReihenTage === KA.wirkung.universumSumme, 'Eichung: Wirkung in A ' + wA.betroffeneReihenTage + ' von ' + wA.universumReihenTage + ' statt ' + KA.wirkung.summe + ' von ' + KA.wirkung.universumSumme);
    muss(wA.lueckenUeberSchwelle === KA.zaehler.luecken && wB.kurzluecken === wA.kurzluecken, 'Luecken in A ' + wA.lueckenUeberSchwelle + ', Kurzluecken A/B ' + wA.kurzluecken + '/' + wB.kurzluecken);
    muss((zs.lueckenTrennungen || 0) === LT.trennungen.length, 'Bau-Zaehler lueckenTrennungen ' + zs.lueckenTrennungen);
    muss(PB.N === PA.N && PB.stand.letzterVollTag === PA.stand.letzterVollTag, 'Zeilenzahl oder letzter voller Tag weichen ab');
  }
}
var ERG = { kennung: 'querschnitt-pruefstand-2026-09-13/pruefung-v22/v1', stand: new Date().toISOString(), aufruf: A, bestanden: gruende.length === 0, gruende: gruende,
  liste: liste, a: { ordner: A.a, kennung: PA.stand.kennung, zeilen: PA.N, reihen: PA.nSym, reihenMitZeilen: Array.prototype.filter.call(PA.anz, function (v) { return v > 0; }).length, letzterVollTag: PA.stand.letzterVollTag, zeilenVerglichen: zeilenAVerglichen },
  b: { ordner: A.b, kennung: PB.stand.kennung, zeilen: PB.N, reihen: PB.nSym, reihenMitZeilen: Array.prototype.filter.call(PB.anz, function (v) { return v > 0; }).length, letzterVollTag: PB.stand.letzterVollTag,
    zaehler: { trennungen: zs.trennungen, lueckenTrennungen: zs.lueckenTrennungen, lueckenUngetrennt: zs.lueckenUngetrennt, trennungAbweichung: zs.trennungAbweichung, splitAkzeptiert: zs.splitAkzeptiert, splitAbgelehnt: zs.splitAbgelehnt, reihen: zs.reihen, ohneZeilen: zs.ohneZeilen }, luecken: PB.stand.luecken || null },
  soll: { zeilenWechseln: wechselSollHier, neueReihen: neueSollHier }, vergleich: Z, schluesselDoppelt: { a: doppeltA, b: doppeltB },
  bitgleichGeprueft: ['kerzen'].concat(BITNAMEN), wirkung: { definition: WIRK, a: kurzW(wA), aGanzesPanel: kurzW(wAganz), b: kurzW(wB), trockenlauf: { summe: KA.wirkung.summe, universum: KA.wirkung.universumSumme } },
  unerklaertBeispiele: UNERKL, sekunden: Math.round((Date.now() - t0) / 100) / 10 };
fs.writeFileSync(A.aus + '.tmp', JSON.stringify(ERG, null, 1)); fs.renameSync(A.aus + '.tmp', A.aus);
sag('Vergleich: gemeinsam ' + Z.gemeinsam + ', fehlt in B ' + Z.fehltInB + ', nur in B ' + Z.nurInB + ' | (a) Reihenname ' + Z.nameWechsel + ' Zeilen in ' + Z.neueReihenMitZeilen + ' neuen Reihen (Soll ' + wechselSollHier + ' / ' + neueSollHier + ')');
sag('  (b) rendite an ersten Zeilen ' + Z.renditeErsteZeile + ' | (c) klasse -1 neu ' + Z.klasseUnreif + ', Fenster neu ' + Z.klasseFensterNeu + ', Marke KEINE_RENDITE ' + Z.markeKeineRendite + ', LETZTER_TAG ' + Z.markeLetzterTag + ' | UNERKLAERT ' + Z.unerklaert + ' ' + JSON.stringify(Z.unerklaertJeArt));
sag('Wirkung (Reihen-Tage mit Luecke im 252-Zeilen-Fenster / Universum): A ' + wA.betroffeneReihenTage + ' / ' + wA.universumReihenTage + ' -> B ' + wB.betroffeneReihenTage + ' / ' + wB.universumReihenTage + ' | Luecken > ' + K.LUECKE_TRENN_TAGE + ' T. in einer Reihe: A ' + wA.lueckenUeberSchwelle + ' -> B ' + wB.lueckenUeberSchwelle + ' | Kurzluecken A ' + wA.kurzluecken + ' B ' + wB.kurzluecken);
sag((ERG.bestanden ? 'BESTANDEN' : 'NICHT BESTANDEN: ' + gruende.join(' | ')) + ' (' + ERG.sekunden + ' s) -> ' + A.aus);
process.exit(ERG.bestanden ? 0 : 1);
