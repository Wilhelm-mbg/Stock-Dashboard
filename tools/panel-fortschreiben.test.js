'use strict';
/* KUNSTTESTS der Panel-Fortschreibung (Auftrag Nr. 123). Mini-Archiv und Mini-Stamm im Temp-Ordner; der Stamm wird mit dem
 * ORIGINALEN Bauweg gebaut (lesen-panel.js ladeJahr + paneldaten.js zeilenAus), damit die Wiedergabe-Probe gegen den Panelbau
 * selbst prueft und nicht gegen eine zweite Fassung derselben Idee.
 *   node tools/panel-fortschreiben.test.js
 * Prueft: Anhaengen, alte Bloecke byte-gleich, alte Zeilen gleich bis auf die zwei Marken, Kunst-Split vorwaerts verankert
 * (bereinigt stetig, roh roh), Abgang mit Grund, Abbruch bei Vorgaenger-Doppel, Abbruch bei Nachleben, SPY-Kreuzprobe,
 * idempotent (zweiter Lauf gleiche Pruefsummen, Ziel nie ueberschrieben), Nullprobe, NYSE-Kalender gegen den Alpaca-Kalender,
 * Massnahmen-Abruf nur fuer lebende Reihen ohne Zugang in Ausgabe/Datei. Kein Netz (Abruf gegen eine Attrappe). */
var fs = require('fs');
var path = require('path');
var os = require('os');
var crypto = require('crypto');

var REPO = path.join(__dirname, '..');
var PS = path.join(REPO, 'studien', 'querschnitt-pruefstand-2026-09-13');
var K = require(path.join(PS, 'konfig.js'));
var P = require(path.join(PS, 'paneldaten.js'));
var LP = require(path.join(PS, 'lesen-panel.js'));
var F = require('./panel-fortschreiben.js');
var NYSE = require('./nyse-kalender.js');

var gruen = 0, rot = 0;
function ok(b, text, info) { if (b) gruen++; else rot++; console.log((b ? 'ok   ' : 'ROT  ') + text + (info !== undefined ? ' | ' + info : '')); }
function sha(b) { return crypto.createHash('sha256').update(b).digest('hex'); }
var TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'panel-fortschreiben-kunst-'));

/* ---------- Kunstwelt ---------- */
var STAMM_VON = '2025-12-01', L = '2026-02-13', ENDE = '2026-03-06', EX_B = '2026-02-20';
function ms(tag, h, m) { var p = tag.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2], h + 5, m); }   /* Winterzeit: alle Tage vor dem 08.03. */
var KAL = NYSE.tage('2016-01-01', '2026-12-31');
var TAGE = Object.keys(KAL).sort();
function tageIn(von, bis) { return TAGE.filter(function (t) { return t >= von && t <= bis; }); }
/** Minutendatei eines Jahres: preis(tag, k) -> Kurs der k-ten Tageszahl; schluss(tag) -> Druck der 16:00-Kerze */
function minutenDatei(tage, preis) {
  var series = [], sitz = [];
  tage.forEach(function (t, d) {
    var p = preis(t, d);
    for (var k = 0; k < 390; k++) { var z = ms(t, 9, 30) + k * 60000; series.push([z, p, 1000, p, p, p]); }
    series.push([ms(t, 16, 0), p, 5000, p, p, p]);
    sitz.push({ von: ms(t, 9, 30), bis: ms(t, 15, 59), sitzung: 'regulaer' }, { von: ms(t, 16, 0), bis: ms(t, 16, 0), sitzung: 'nach' });
  });
  return { sym: 'x', format: 2, quellen: [{ von: series[0][0], bis: series[series.length - 1][0], quelle: 'alpaca' }], sitzungen: sitz, series: series };
}
function welt(name, reihen) {
  var W = path.join(TMP, name), roh = path.join(W, 'alpaca1m');
  fs.mkdirSync(roh, { recursive: true });
  fs.mkdirSync(path.join(W, 'alpaca-massnahmen'), { recursive: true });
  fs.mkdirSync(path.join(W, 'alpaca-massnahmen-nachtrag-2026-03'), { recursive: true });
  fs.mkdirSync(path.join(W, 'archiv1d', 'etf'), { recursive: true });
  fs.writeFileSync(path.join(roh, '_kalender.json'), JSON.stringify({ von: '2016-01-01', bis: '2026-12-31', tage: KAL }));
  var man = { stand: '2026-03-07T00:00:00.000Z', eintraege: {} };
  reihen.forEach(function (r) {
    fs.mkdirSync(path.join(roh, r.name), { recursive: true });
    [2025, 2026].forEach(function (j) {
      var tg = tageIn(j === 2025 ? STAMM_VON : '2026-01-01', j === 2025 ? '2025-12-31' : (r.bis || ENDE));
      var D = minutenDatei(tg, function (t) { return r.preis(t, TAGE.indexOf(t)); });
      fs.writeFileSync(path.join(roh, r.name, j + '.json'), JSON.stringify(D));
      man.eintraege[r.name + '/' + j + '.json'] = { sym: r.name, jahr: j, erster: D.series[0][0], letzter: D.series[D.series.length - 1][0] };
    });
    if (r.nachtrag) fs.writeFileSync(path.join(W, 'alpaca-massnahmen-nachtrag-2026-03', r.name + '.json'), JSON.stringify({ sym: r.name, saetze: r.nachtrag }));
  });
  fs.writeFileSync(path.join(roh, '_manifest.json'), JSON.stringify(man));
  /* archiv1d: SPY mit Yahoo-Stempel (Eroeffnung 09:30 ET), Schluss = Panelschluss */
  var spy = reihen.filter(function (r) { return r.name === 'SPY'; })[0];
  fs.writeFileSync(path.join(W, 'archiv1d', 'etf', 'bars_1d_SPY.json'), JSON.stringify({ series: tageIn(STAMM_VON, ENDE).map(function (t) { var p = spy.preis(t, TAGE.indexOf(t)); return [ms(t, 9, 30), p, 1e6, p, p, p]; }) }));
  return W;
}
/** Stamm mit dem Originalweg: ladeJahr + zeilenAus bis L, Bloecke 2024 (eine Kunstzeile), 2025, 2026 */
function stammBauen(W, reihen, ziel) {
  process.env.MD_ALPACA_WURZEL = W;
  var kal = F.kalender(W), namen = reihen.map(function (r) { return r.name; }).sort();
  var jeJahr = { 2025: [], 2026: [] }, zjt = {};
  namen.forEach(function (n, idx) {
    var R = { reihe: n, ordner: n, schnittMs: null, abMs: null, idx: idx }, tage = [], rein = {};
    [2025, 2026].forEach(function (j) { var jr = LP.ladeJahr(R, j, kal, { eigeneSplits: [] }); rein[j] = jr.quelleRein; jr.tage.forEach(function (t) { if (t.tag <= L) { t.bFaktor = 1; tage.push(t); } }); });
    var z = { schlussErsatz: {}, eroeffnungErsatz: {}, tageJeJahr: {}, stempeltage: 0, luecken: 0, trennungen: 0, trennungAbweichung: 0 };
    P.zeilenAus(tage, R, kal, z, new Set(), rein).forEach(function (r) { jeJahr[r.jahr].push(r); zjt[r.tag] = (zjt[r.tag] || 0) + 1; });
  });
  var pan = path.join(ziel, 'panel'); fs.mkdirSync(pan, { recursive: true });
  function block(zs, j) {
    zs.sort(function (a, b) { return a.tag - b.tag || a.symIdx - b.symIdx; });
    var sp = P.leer(Math.max(1, zs.length));
    zs.forEach(function (r, i) { sp.sym[i] = r.symIdx; sp.tag[i] = r.tag; sp.marken[i] = r.marken; sp.klasse[i] = r.klasse; sp.kerzen[i] = r.kerzen; sp.rohSchluss[i] = r.rohSchluss;
      sp.rohEroeffnung[i] = r.rohEroeffnung; sp.faktor[i] = r.faktor; sp.rendite[i] = r.rendite; sp.renditeOC[i] = r.renditeOC; sp.umsatzReg[i] = r.umsatzReg; sp.umsatzAuktion[i] = r.umsatzAuktion; });
    fs.writeFileSync(path.join(pan, j + '.bin'), F.blockPuffer(sp, zs.length, j));
    return zs.length;
  }
  function eine(t) { return [{ symIdx: 0, tag: kal.idx[t], marken: 1, klasse: 2, kerzen: 390, rohSchluss: 50, rohEroeffnung: 50, faktor: 1, rendite: 0.5, renditeOC: 0, umsatzReg: 1, umsatzAuktion: 1 }]; }
  var n23 = block(eine('2023-12-29'), 2023), n24 = block(eine('2024-12-31'), 2024), n25 = block(jeJahr[2025], 2025), n26 = block(jeJahr[2026], 2026);
  var stand = { kennung: K.PANEL_KENNUNG_V23, konfig: K.KONFIG_KENNUNG, stand: '2026-02-14T00:00:00.000Z', zeilen: n23 + n24 + n25 + n26,
    jahre: [{ jahr: 2023, n: n23 }, { jahr: 2024, n: n24 }, { jahr: 2025, n: n25 }, { jahr: 2026, n: n26 }], zeilenJeTag: zjt, letzterVollTagIdx: kal.idx[L], letzterVollTag: L, unvollstaendigeTage: [],
    symbole: namen.map(function (n) { return { reihe: n, ordner: n, lebend: 1, art: n === 'SPY' ? 'ETF' : 'CS', referenz: n === 'SPY', ende_grund: null, ende_datum: null }; }),
    tage: kal.tage.filter(function (t) { return t <= '2026-12-31'; }), bau: '2c' };
  fs.writeFileSync(path.join(pan, '_stand.json'), JSON.stringify(stand));
  return { stand: stand, kal: kal };
}
function pfad(t) { return 100 * Math.pow(1.002, TAGE.indexOf(t) - TAGE.indexOf(STAMM_VON)); }
var A = { name: 'A', preis: function (t) { return +(pfad(t)).toFixed(4); } };
var Bs = { name: 'B', preis: function (t) { return +((t >= EX_B ? 1 : 2) * pfad(t) * 1.5).toFixed(4); },
  nachtrag: [{ _art: 'forward_splits', symbol: 'B', ex_date: EX_B, old_rate: 1, new_rate: 2, id: 'kunst-split-b' }] };
var Dd = { name: 'D', bis: L, preis: function (t) { return +(pfad(t) * 0.7).toFixed(4); },
  nachtrag: [{ _art: 'cash_mergers', acquiree_symbol: 'D', acquirer_symbol: 'ZZ', effective_date: '2026-02-17', id: 'kunst-merger-d' }] };
var SPY = { name: 'SPY', preis: function (t) { return +(5 * pfad(t) * 1.0001).toFixed(4); } };

/* ================= Welt 1: der Normalfall ================= */
var W1 = welt('w1', [A, Bs, Dd, SPY]), ST1 = path.join(TMP, 'w1-stamm');
var S1 = stammBauen(W1, [A, Bs, Dd, SPY], ST1);
var vorher = {}; fs.readdirSync(path.join(ST1, 'panel')).forEach(function (f) { vorher[f] = sha(fs.readFileSync(path.join(ST1, 'panel', f))); });
var E1 = F.rechnen({ stamm: ST1, wurzel: W1, deckel: ENDE }), B1 = E1.B;
ok(B1.bestanden === true, 'Welt 1 bestanden (keine Befunde)', JSON.stringify(B1.befunde));
var stammZeilen2026 = S1.stand.jahre[3].n;
ok(B1.kontrollen.wiedergabe.tageGleich === stammZeilen2026 && B1.kontrollen.wiedergabe.tageAnders === 0 && B1.kontrollen.wiedergabe.tageRundung === 0,
  'Wiedergabe: jede Stamm-Zeile 2026 Feld fuer Feld aus der Rohdatei nachgerechnet (Originalweg ladeJahr+zeilenAus)', B1.kontrollen.wiedergabe.tageGleich + ' von ' + stammZeilen2026);
var neueTage = tageIn('2026-02-14', ENDE).length;
ok(B1.zahlen.neueTage === neueTage && B1.zahlen.neueZeilen === 3 * neueTage, 'Anhaengen: ' + neueTage + ' neue Tage x 3 fortgeschriebene Reihen (D verstummt)', B1.zahlen.neueZeilen);
ok(sha(E1.bloecke[2026].puffer) !== vorher['2026.bin'] && E1.bloecke[2024].kopie && E1.bloecke[2025].kopie, 'Bloecke vor dem Jahr des Stamm-Endes werden kopiert, nicht neu geschrieben');
/* alte Zeilen 2026: alles gleich ausser LETZTER_TAG (weg) und MASSNAHME_NAH (dazu) */
var alt26 = P.leseBlock(path.join(ST1, 'panel', '2026.bin'), K.PANEL_KENNUNG_V23), neu26 = E1.bloecke[2026].sp, gleichAlt = 0, nurBits = 0, andersAlt = 0;
for (var i = 0; i < alt26.n; i++) {
  var feld = P.SPALTEN.every(function (c) { return c.name === 'marken' || (alt26[c.name][i] === neu26[c.name][i] || (alt26[c.name][i] !== alt26[c.name][i] && neu26[c.name][i] !== neu26[c.name][i])); });
  if (!feld) { andersAlt++; continue; }
  if (alt26.marken[i] === neu26.marken[i]) gleichAlt++;
  else if (((alt26.marken[i] ^ neu26.marken[i]) & ~(K.M_LETZTER_TAG | K.M_MASSNAHME_NAH)) === 0) nurBits++; else andersAlt++;
}
var wegL = 0, dazuN = 0; for (var i5 = 0; i5 < alt26.n; i5++) { var x5 = alt26.marken[i5] ^ neu26.marken[i5]; if (x5 & K.M_LETZTER_TAG) wegL++; if (x5 & K.M_MASSNAHME_NAH) dazuN++; }
ok(andersAlt === 0 && wegL === B1.kontrollen.bitsGeaendert.letzterTagEntfernt && dazuN === B1.kontrollen.bitsGeaendert.massnahmeNahGesetzt && wegL === 3 && dazuN > 0,
  'alte Zeilen 2026: alle Spalten gleich, nur die zwei Marken (LETZTER_TAG x3 weg, MASSNAHME_NAH vor dem Split dazu)', 'gleich ' + gleichAlt + ', nur Marke ' + nurBits + ' (LETZTER_TAG ' + wegL + ', MASSNAHME_NAH ' + dazuN + '), anders ' + andersAlt);
/* Kunst-Split B 2:1 am EX_B, vorwaerts verankert */
var symB = 1, iVor = -1, iAb = -1;
for (var q = alt26.n; q < neu26.n || q < E1.bloecke[2026].n; q++) { if (neu26.sym[q] !== symB) continue; var tg = S1.kal.tage[neu26.tag[q]]; if (tg < EX_B) iVor = q; if (tg === EX_B) iAb = q; }
var bVor = neu26.rohSchluss[iVor] / neu26.faktor[iVor], bAb = neu26.rohSchluss[iAb] / neu26.faktor[iAb];
ok(iVor > 0 && iAb > 0 && neu26.faktor[iVor] === 1 && neu26.faktor[iAb] === 0.5 && Math.abs(neu26.rendite[iAb] - 0.2) < 0.01 && Math.abs(bAb / bVor - 1.002) < 1e-4 &&
  Math.abs(neu26.rohSchluss[iAb] / neu26.rohSchluss[iVor] - 0.501) < 1e-3 && (neu26.marken[iAb] & K.M_MASSNAHME_NAH),
  'Kunst-Split B 2:1: faktor 1 -> 0,5 (faktor_L / f), Rendite am Ex-Tag +0,2 % statt -50 %, bereinigt stetig, roh halbiert (roh bleibt roh), Marke MASSNAHME_NAH',
  'faktor ' + neu26.faktor[iVor] + '->' + neu26.faktor[iAb] + ', rendite ' + neu26.rendite[iAb].toFixed(3) + ', roh ' + neu26.rohSchluss[iVor].toFixed(2) + '->' + neu26.rohSchluss[iAb].toFixed(2));
var T1 = JSON.parse(E1.standText), d1 = T1.symbole.filter(function (s) { return s.reihe === 'D'; })[0];
ok(d1.lebend === 0 && d1.ende_grund === 'uebernahme' && d1.ende_alpaca === 'cash_mergers' && d1.ende_datum === L && T1.symbole.filter(function (s) { return s.lebend; }).length === 3,
  'Abgang: D mit Uebernahme (cash_mergers) -> lebend 0, Grund uebernahme (Alpaca-Art behalten), Ende = letzte Zeile', d1.ende_grund + '/' + d1.ende_alpaca + ' ' + d1.ende_datum);
ok(T1.kennung === K.PANEL_KENNUNG_V23 && T1.bau === 'v2.3+2026-03' && T1.letzterVollTag === ENDE && T1.fortschreibung.sha256['2024'] === vorher['2024.bin'] && T1.fortschreibung.sha256['2025'] === vorher['2025.bin'],
  'Stand: Kennung v2.3 bleibt, bau v2.3+2026-03, letzter voller Tag = Deckel, Pruefsummen der alten Bloecke = Stamm', T1.bau);
var bl24 = fs.readFileSync(path.join(ST1, 'panel', '2026.bin')); var kopfNeu = JSON.parse(E1.bloecke[2026].puffer.slice(4, 4 + E1.bloecke[2026].puffer.readUInt32LE(0)).toString());
ok(kopfNeu.kennung === K.PANEL_KENNUNG_V23 && kopfNeu.jahr === 2026 && Object.keys(kopfNeu).join() === 'kennung,n,spalten,jahr' && bl24.length > 0, 'Blockkopf 2026: dieselbe Form wie der Bau (kennung, n, spalten, jahr), Kennung v2.3');
ok(B1.kontrollen.spy.verglichen === neueTage && B1.kontrollen.spy.maxPp < 1e-6, 'SPY-Kreuzprobe gegen archiv1d/etf (Yahoo-Stempel = Eroeffnung): jeder neue Tag verglichen, Abstand 0', JSON.stringify(B1.kontrollen.spy));
/* idempotent und Schreiben */
var E1b = F.rechnen({ stamm: ST1, wurzel: W1, deckel: ENDE });
ok(JSON.stringify(E1b.B.sha256) === JSON.stringify(B1.sha256), 'zweiter Lauf: dieselben Pruefsummen (Bloecke und Stand)', B1.sha256.stand.slice(0, 12));
var Z1 = path.join(TMP, 'w1-ziel');
F.schreiben(E1, Z1);
var PO = F.pruefenOrdner(Z1);
var nachher = {}; fs.readdirSync(path.join(ST1, 'panel')).forEach(function (f) { nachher[f] = sha(fs.readFileSync(path.join(ST1, 'panel', f))); });
ok(PO.gueltig && sha(fs.readFileSync(path.join(Z1, 'panel', '2025.bin'))) === vorher['2025.bin'] && JSON.stringify(vorher) === JSON.stringify(nachher),
  'geschrieben: Pruefsummen gueltig, 2025.bin byte-gleich, Stamm unberuehrt', JSON.stringify(PO.fehler));
var e2 = null; try { F.schreiben(E1b, Z1); } catch (e) { e2 = e; }
ok(e2 && /liegt schon/.test(e2.message), 'Ziel wird nie ueberschrieben (zweites Schreiben bricht ab)');
var TF = require(path.join(REPO, 'pruefstrasse', 'tafel.js'));
var TFo = TF.oeffne({ quelle: 'panel', panel: Z1, bisPanelende: true, ohneSpeicherpruefung: true });
ok(TFo.bau === 'v2.3+2026-03' && TFo.tage[TFo.maxTag] === ENDE && TFo.reihen.length === 3, 'Pruefstrasse liest den Ordner (tafel.js, offen): bau, Panel-Ende = Deckel, 3 Reihen + SPY', TFo.bau + ' ' + TFo.tage[TFo.maxTag]);
/* Kette: auf dem geschriebenen Ordner noch einmal - nichts zu tun */
ok(F.rechnen({ stamm: Z1, wurzel: W1, deckel: ENDE }).B.nichtsZuTun && F.rechnen({ stamm: ST1, wurzel: W1, deckel: L }).B.nichtsZuTun, 'Nullprobe: Deckel = Stamm-Ende -> nichts zu tun');
var nsw = F.rechnen({ stamm: ST1, wurzel: W1, deckel: '2026-03-09' }).B.nichtSoWeit;
ok(!!nsw, 'Deckel hinter dem Archivende -> nicht so weit (Rueckgabe 2, kein Schreiben)', nsw);

/* ================= QS B3: Deckel aus dem Lauftag, Rohdaten muessen ihn tragen ================= */
var B3a = F.rechnen({ stamm: ST1, wurzel: W1, heute: '2026-04-02' }).B, B3b = F.rechnen({ stamm: ST1, wurzel: W1, heute: '2026-03-09' }).B;
ok(!!B3a.nichtSoWeit && /Vormonatsende zum Lauftag 2026-04-02/.test(B3a.nichtSoWeit) && B3b.deckel === '2026-02-27' && B3b.bestanden,
  'B3: Lauftag 02.04. -> Deckel 31.03. liegt hinter den Rohdaten (06.03.) -> kein Lauf; Lauftag 09.03. -> Deckel 27.02. (Vormonatsende), gebaut', B3a.nichtSoWeit);
/* ================= QS B6: Sperre und Platz vor dem Schreiben ================= */
var sperreK = path.join(TMP, 'kunst.panel.lock'); fs.writeFileSync(sperreK, '');
var e6 = null; try { F.schreiben(E1b, path.join(TMP, 'w1-ziel-b6'), { sperre: sperreK }); } catch (e) { e6 = e; }
var e6b = null; try { F.schreiben(E1b, path.join(TMP, 'w1-ziel-b6b'), { sperre: path.join(TMP, 'keine'), platzFaktor: 1e12 }); } catch (e) { e6b = e; }
ok(e6 && /Sperre/.test(e6.message) && e6b && /Platz/.test(e6b.message) && !fs.existsSync(path.join(TMP, 'w1-ziel-b6')) && !fs.existsSync(path.join(TMP, 'w1-ziel-b6b')),
  'B6: liegt .panel.lock oder fehlt Platz (>= 2 x Panelgroesse), wird nichts geschrieben', (e6 && e6.message.slice(0, 40)) + ' | ' + (e6b && e6b.message.slice(0, 40)));

/* ================= Welt 4: QS B1 (ulp), B2 (sofortiger Abgang), B4a (Korrektur), B4b (sprung) ================= */
var EX_N = '2026-02-10', EX_X = '2026-02-25';
var Gg = { name: 'G', bis: '2026-03-02', preis: function (t) { return +(pfad(t) * 1.1).toFixed(4); }, nachtrag: [{ _art: 'cash_mergers', acquiree_symbol: 'G', acquirer_symbol: 'YY', effective_date: '2026-03-03', id: 'kunst-dbrg' }] };
var Hh = { name: 'H', bis: '2026-03-04', preis: function (t) { return +(pfad(t) * 1.2).toFixed(4); }, nachtrag: [{ _art: 'name_changes', old_symbol: 'H', new_symbol: 'HNEU', process_date: '2026-03-04', id: 'kunst-csan' }] };
var Nn = { name: 'N', preis: function (t) { return +((t >= EX_N ? 50 : 1) * pfad(t) * 0.3).toFixed(4); } };
var Xx = { name: 'X', preis: function (t) { return +((t >= EX_X ? 0.4 : 1) * pfad(t) * 2).toFixed(4); },
  nachtrag: [{ _art: 'spin_offs', source_symbol: 'X', new_symbol: 'XNEU', ex_date: EX_X, id: 'kunst-ctva' }] };
var W4 = welt('w4', [A, Gg, Hh, Nn, SPY, Xx]), ST4 = path.join(TMP, 'w4-stamm'); var S4 = stammBauen(W4, [A, Gg, Hh, Nn, SPY, Xx], ST4);
/* ulp: eine fruehe Stamm-Zeile von A im Auktionsumsatz um 1 f32-ulp verschieben (wie CVNA/MIDD/REZI/SPGI) */
var b4 = P.leseBlock(path.join(ST4, 'panel', '2026.bin'), K.PANEL_KENNUNG_V23), iU = -1;
for (var q4 = 0; q4 < b4.n; q4++) if (b4.sym[q4] === 0 && S4.kal.tage[b4.tag[q4]] === '2026-01-07') iU = q4;
var vU = b4.umsatzAuktion[iU]; b4.umsatzAuktion[iU] = new Float32Array(new Uint32Array([new Uint32Array(new Float32Array([vU]).buffer)[0] + 1]).buffer)[0];
fs.writeFileSync(path.join(ST4, 'panel', '2026.bin'), F.blockPuffer(b4, b4.n, 2026));
var KOR4 = [{ reihe: 'N', art: 'reverse_splits', ex: EX_N, old_rate: 50, new_rate: 1, quelle: 'Kunst' }];
var E4 = F.rechnen({ stamm: ST4, wurzel: W4, deckel: ENDE, korrekturen: KOR4 }), B4 = E4.B, T4 = JSON.parse(E4.standText);
ok(B4.bestanden && B4.kontrollen.wiedergabe.tageUlp === 1 && B4.kontrollen.wiedergabe.listeUlp[0].reihe === 'A' && B4.kontrollen.wiedergabe.listeUlp[0].tag === '2026-01-07' && B4.kontrollen.wiedergabe.tageAnders === 0,
  'B1: jede Stamm-Zeile geprueft; 1 f32-ulp im Auktionsumsatz wird gezaehlt und gelistet, kein Abbruch', JSON.stringify(B4.kontrollen.wiedergabe.listeUlp) + ' | Befunde ' + B4.befunde.join(' | '));
var g4 = T4.symbole.filter(function (x) { return x.reihe === 'G'; })[0], h4 = T4.symbole.filter(function (x) { return x.reihe === 'H'; })[0];
ok(g4.lebend === 0 && g4.ende_grund === 'uebernahme' && g4.ende_datum === '2026-03-02' && h4.lebend === 0 && h4.ende_grund === 'umbenennung-ticker' && h4.ende_datum === '2026-03-04',
  'B2: Abgang sofort bei Ende-Massnahme (G Uebernahme 2 Tage vor dem Deckel still, H Umbenennung am letzten Tag) - nicht erst nach 10 stillen Tagen', g4.ende_grund + ' ' + g4.ende_datum + ' / ' + h4.ende_grund + ' ' + h4.ende_datum);
var sN = T4.symbole.findIndex(function (x) { return x.reihe === 'N'; }), sp4 = E4.bloecke[2026].sp, nN = { vor: null, ex: null, neu: null };
for (var q5 = 0; q5 < E4.bloecke[2026].n; q5++) { if (sp4.sym[q5] !== sN) continue; var t5 = S4.kal.tage[sp4.tag[q5]]; if (t5 === '2026-02-09') nN.vor = q5; if (t5 === EX_N) nN.ex = q5; if (t5 === '2026-02-17') nN.neu = q5; }
var stN = P.leseBlock(path.join(ST4, 'panel', '2026.bin'), K.PANEL_KENNUNG_V23);
ok(sp4.faktor[nN.vor] === 1 && sp4.faktor[nN.ex] === 50 && Math.abs(sp4.rendite[nN.ex] - 0.2) < 0.01 && stN.rendite[nN.ex] > 4000 && sp4.faktor[nN.neu] === 50 && Math.abs(sp4.rendite[nN.neu] - 0.2) < 0.01 &&
  sp4.rohSchluss[nN.ex] === stN.rohSchluss[nN.ex] && B4.kontrollen.wiedergabe.korrekturAusgenommen > 0 && B4.kontrollen.korrekturen.length === 1 && T4.fortschreibung.korrekturen[0].schluessel === 'N|reverse_splits|' + EX_N,
  'B4a: Korrektur N 1:50 im Stamm-Zeitraum: faktor ab Ex-Tag 50, Rendite am Ex-Tag ' + (stN.rendite[nN.ex]).toFixed(0) + ' % -> +0,2 %, roh bleibt, neue Zeilen tragen 50, Zeilen aus der Byte-Pruefung ausgenommen und gemeldet',
  B4.zahlen.korrekturen.join(' | '));
var sX = T4.symbole.findIndex(function (x) { return x.reihe === 'X'; });
var sprX = T4.sprungZeilen.filter(function (z) { return z[0] === sX; });
ok(sprX.length === 1 && S4.kal.tage[sprX[0][1]] === EX_X && B4.kontrollen.sprung.neu === 1,
  'B4b: Abspaltung ohne Faktor (X -60 % am Ex-Tag, MASSNAHME_NAH) -> Marke sprung in der Liste des Stands, gezaehlt', JSON.stringify(B4.kontrollen.sprung));
var Z4 = path.join(TMP, 'w4-ziel'); F.schreiben(E4, Z4);
var TF4 = TF.oeffne({ quelle: 'panel', panel: Z4, bisPanelende: true, ohneSpeicherpruefung: true }), SX = TF4.reihen.filter(function (x) { return x.reihe === 'X'; })[0];
var AT = require(path.join(REPO, 'pruefstrasse', 'adapter', 'tag.js')), CK = require(path.join(REPO, 'studien', 'vorregistrierung-2026-09-08-trendkanal-tage', 'kanaele.js'));
var pEx = -1; for (var q6 = 0; q6 < SX.n; q6++) if (TF4.tage[SX.tag[q6]] === EX_X) pEx = q6;
var zS = {}, ueber = AT.ertragOhneSprung(SX, pEx - 3, CK.festAusstieg(SX, pEx - 3, 5), SX.lebend, zS), davor = AT.ertragOhneSprung(SX, pEx - 8, CK.festAusstieg(SX, pEx - 8, 5), SX.lebend, zS), danach = AT.ertragOhneSprung(SX, pEx, CK.festAusstieg(SX, pEx, 5), SX.lebend, zS);
ok(TF4.sprungZeilen === 1 && SX.mass[pEx] === 1 && ueber === null && davor && danach && zS.sprung === 1,
  'Pruefstrasse: sprung-Zeile ist kein Einstiegstag, ein Fenster darueber hat keinen Horizont (Zaehler sprung), Fenster davor/ab dem Tag bleiben', 'sprung ' + TF4.sprungZeilen + ', Zaehler ' + zS.sprung);
var TFe = TF.oeffne({ quelle: 'panel', panel: ST4, bisPanelende: true, ohneSpeicherpruefung: true }), SXe = TFe.reihen.filter(function (x) { return x.reihe === 'X'; })[0];
ok(TFe.sprungZeilen === 0 && !SXe.sprungKum, 'ohne sprung-Liste (Stamm wie voll-v23c) bleibt alles wie bisher (Eichung bitgleich)');
/* Welt 5: echte Abweichung in einer FRUEHEN Stamm-Zeile (nicht in den letzten 60) -> Abbruch */
var W5 = welt('w5', [A, SPY]), ST5 = path.join(TMP, 'w5-stamm'); var S5 = stammBauen(W5, [A, SPY], ST5);
var b5 = P.leseBlock(path.join(ST5, 'panel', '2026.bin'), K.PANEL_KENNUNG_V23); for (var q7 = 0; q7 < b5.n; q7++) if (b5.sym[q7] === 0 && S5.kal.tage[b5.tag[q7]] === '2026-01-05') b5.rohSchluss[q7] *= 1.01;
fs.writeFileSync(path.join(ST5, 'panel', '2026.bin'), F.blockPuffer(b5, b5.n, 2026));
var B5 = F.rechnen({ stamm: ST5, wurzel: W5, deckel: ENDE }).B;
ok(!B5.bestanden && B5.kontrollen.wiedergabe.tageAnders === 1 && B5.kontrollen.wiedergabe.listeAnders[0].tag === '2026-01-05' && B5.befunde.some(function (b) { return /Wiedergabe: 1 Reihen mit echter Abweichung/.test(b); }),
  'B1: echte Abweichung auch in einer fruehen Stamm-Zeile (05.01.) -> gelistet, Reihe nicht fortgeschrieben, Abbruch', JSON.stringify(B5.kontrollen.wiedergabe.listeAnders));

/* ================= Welt 2: Vorgaenger-Doppel ================= */
var Cc = { name: 'C', preis: function (t) { return t > L ? A.preis(t) : +(pfad(t) * 3).toFixed(4); } };
var W2 = welt('w2', [A, Cc, SPY]), ST2 = path.join(TMP, 'w2-stamm'); stammBauen(W2, [A, Cc, SPY], ST2);
var B2 = F.rechnen({ stamm: ST2, wurzel: W2, deckel: ENDE }).B;
ok(!B2.bestanden && B2.befunde.some(function (b) { return /Vorgaenger-Doppel: A = C/.test(b); }), 'Abbruch bei Doppel: C traegt ab dem Stamm-Ende die Kurse von A', B2.befunde.join(' | '));
/* ================= Welt 3: Nachleben ================= */
var Ee = { name: 'E', preis: function (t) { return +(pfad(t) * 0.9).toFixed(4); }, nachtrag: [{ _art: 'cash_mergers', acquiree_symbol: 'E', effective_date: '2026-02-18', id: 'kunst-merger-e' }] };
var W3 = welt('w3', [A, Ee, SPY]), ST3 = path.join(TMP, 'w3-stamm'); stammBauen(W3, [A, Ee, SPY], ST3);
var B3 = F.rechnen({ stamm: ST3, wurzel: W3, deckel: ENDE }).B;
ok(!B3.bestanden && B3.befunde.some(function (b) { return /Nachleben: E cash_mergers 2026-02-18/.test(b); }), 'Abbruch bei Nachleben: E nach der Uebernahme noch mit Zeilen', B3.befunde.join(' | '));

/* ================= NYSE-Kalender ================= */
var ech = path.join(K.archivWurzel === undefined ? 'E:/Markt-Dashboard-Archiv' : 'E:/Markt-Dashboard-Archiv', 'alpaca1m', '_kalender.json');
delete process.env.MD_ALPACA_WURZEL;
if (fs.existsSync(ech)) {
  var Aq = JSON.parse(fs.readFileSync(ech, 'utf8')).tage, Rg = NYSE.tage('2016-01-01', '2026-12-31'), ab = 0;
  Object.keys(Aq).forEach(function (t) { if (!Rg[t] || Rg[t].close !== Aq[t].close || Rg[t].open !== Aq[t].open) ab++; });
  Object.keys(Rg).forEach(function (t) { if (!Aq[t]) ab++; });
  ok(ab === 0 && Object.keys(Aq).length === 2765, 'NYSE-Regel = Alpaca-Kalender 2016-2026 (2.765 Tage, Halbtage, Sonderschliessungen)', ab + ' Abweichungen');
} else ok(true, 'Alpaca-Kalender nicht da - Vergleich uebersprungen');
var t27 = NYSE.tage('2027-01-01', '2030-12-31');
ok(!t27['2027-03-26'] && !t27['2027-12-24'] && t27['2027-12-31'] && t27['2028-07-03'].close === '13:00' && !t27['2028-12-25'] && Object.keys(t27).length === 1004,
  'NYSE 2027-2030: Karfreitag 2027, Weihnachten (Sa) am Fr 24.12.2027 frei, Silvester 2027 offen (Neujahr 2028 Sa), 03.07.2028 halber Tag', Object.keys(t27).length + ' Tage');

/* ================= Massnahmen-Abruf (Attrappe) ================= */
var MA = require('./panel-fortschreiben-massnahmen.js');
var gefragt = [], GEHEIM = 'kunst-zugang-' + 'x9q7';
var Wm = path.join(TMP, 'wm'); fs.mkdirSync(Wm, { recursive: true });
MA.holen({ wurzel: Wm, symbole: ['A', 'B', 'BRK.B'], von: '2026-09-16', bis: '2026-10-22', ordnerName: 'alpaca-massnahmen-nachtrag-2026-10x', block: 2, rate: 1000,
  kopfzeilen: function () { return { 'APCA-API-KEY-ID': GEHEIM, 'APCA-API-SECRET-KEY': GEHEIM }; },
  fetch: async function (url) { gefragt.push(url); var sy = decodeURIComponent(/symbols=([^&]*)/.exec(url)[1]).split(',');
    var ca = { forward_splits: sy.indexOf('B') !== -1 ? [{ symbol: 'B', ex_date: '2026-10-01', old_rate: 1, new_rate: 2, id: 'x1' }] : [] };
    return { status: 200, headers: { get: function () { return null; } }, text: async function () { return JSON.stringify({ corporate_actions: ca, next_page_token: null }); } }; } })
  .then(function (R) {
    var datei = path.join(Wm, 'alpaca-massnahmen-nachtrag-2026-10x'), alles = fs.readdirSync(datei).map(function (f) { return fs.readFileSync(path.join(datei, f), 'utf8'); }).join('');
    ok(R.ok && gefragt.length === 2 && gefragt.every(function (u) { return /symbols=/.test(u) && u.indexOf(GEHEIM) === -1; }) && fs.existsSync(path.join(datei, 'B.json')) && fs.existsSync(path.join(datei, '_nachtrag.json')),
      'Massnahmen-Abruf: nur die genannten Kuerzel (symbols=, Bloecke zu 2), Ergebnis im Nachtrag-Ordner', gefragt.length + ' Abrufe, Dateien ' + fs.readdirSync(datei).join(','));
    ok(alles.indexOf(GEHEIM) === -1 && R.ausgabe.indexOf(GEHEIM) === -1, 'Zugang steht in keiner Datei und keiner Ausgabe');
    return MA.holen({ wurzel: Wm, symbole: ['A'], von: '2026-09-16', bis: '2026-10-22', ordnerName: 'alpaca-massnahmen-nachtrag-2026-10x', kopfzeilen: function () { return {}; }, fetch: async function () { throw new Error('darf nicht fragen'); } });
  })
  .then(function (R2) {
    ok(R2.ok && R2.schonDa, 'Nachtrag-Ordner liegt schon -> kein zweiter Abruf, nichts ueberschrieben');
  })
  .catch(function (e) { ok(false, 'Massnahmen-Abruf', e.stack); })
  .then(function () {
    if (process.env.KUNST_BEHALTEN) console.log('Kunstwelt behalten: ' + TMP); else try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* Temp */ }
    console.log((rot ? 'ROT' : 'GRUEN') + ': ' + gruen + ' gruen, ' + rot + ' rot');
    process.exit(rot ? 1 : 0);
  });
