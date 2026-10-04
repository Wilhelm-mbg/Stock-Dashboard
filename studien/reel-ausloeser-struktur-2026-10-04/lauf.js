'use strict';
/* Auftrag Nr. 89R-2 (Reel-Strategien, Teil 2) - der eine Lauf.
 *   node --max-old-space-size=3072 studien/reel-ausloeser-struktur-2026-10-04/lauf.js > .../lauf.log 2>&1
 * Weigert sich, solange REGEL.md, Code und Tests nicht committet sind (Siegel). Erster Schritt nach dem Laden von QQQ ist
 * die Eichung der Ereignis-Sicht A1 gegen Teil 1 (eichung.json); trifft sie nicht, endet der Lauf dort, ohne eine weitere
 * Zahl zu rechnen. Liest E: nur (ueber daten.js aus Teil 1, jede der 33 Jahresdateien genau einmal), schreibt nur in diesen Ordner. */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var cp = require('child_process');
var D = require('../reel-vwap-ema-2026-10-04/daten');
var K1 = require('../reel-vwap-ema-2026-10-04/kern');
var K = require('./kern');

var ORDNER = __dirname;
var TEIL1 = path.resolve(ORDNER, '..', 'reel-vwap-ema-2026-10-04');
var SIEGEL_DATEIEN = ['REGEL.md', 'kern.js', 'lauf.js', 'test.js'];
var TEIL1_DATEIEN = ['daten.js', 'kern.js'];
var HAUPT = { wert: 'QQQ', ausloeser: 'Alle', H: 5, fenster: 'W-Nach' };
var TEIL1_GERUNDET = { n: 11736, h5: 0.02, h15: 0.08 };

function siegel() {
  var wurzel = path.resolve(ORDNER, '..', '..');
  var eigene = SIEGEL_DATEIEN.map(function (d) { return 'studien/' + path.basename(ORDNER) + '/' + d; });
  var fremde = TEIL1_DATEIEN.map(function (d) { return 'studien/' + path.basename(TEIL1) + '/' + d; });
  var status = cp.execFileSync('git', ['status', '--porcelain', '--'].concat(eigene, fremde), { cwd: wurzel, encoding: 'utf8' }).trim();
  if (status) {
    console.log('Siegel fehlt - diese Dateien sind nicht committet oder geaendert:\n' + status);
    process.exit(3);
  }
  var hashes = {};
  SIEGEL_DATEIEN.forEach(function (d) { hashes[d] = crypto.createHash('sha256').update(fs.readFileSync(path.join(ORDNER, d))).digest('hex').slice(0, 16); });
  TEIL1_DATEIEN.forEach(function (d) { hashes['teil1/' + d] = crypto.createHash('sha256').update(fs.readFileSync(path.join(TEIL1, d))).digest('hex').slice(0, 16); });
  var letzter = cp.execFileSync('git', ['log', '-1', '--format=%h', '--'].concat(eigene), { cwd: wurzel, encoding: 'utf8' }).trim();
  return { commit: letzter, sha256: hashes };
}

function fensterNach(name) { return K1.FENSTER.filter(function (f) { return f.name === name; })[0]; }

/* ------------------------------------------------------------------ Eichung gegen Teil 1 (Paragraph 3, M24) */
function teil1Zellen() {
  var E1 = JSON.parse(fs.readFileSync(path.join(TEIL1, 'ergebnis.json'), 'utf8'));
  var nimm = function (H) { return E1.ereignisse.filter(function (x) { return x.regel === 'R1' && x.wert === 'QQQ' && x.fenster === 'W-Nach' && x.H === H; })[0]; };
  return { siegel: E1.siegel.commit, h5: nimm(5), h15: nimm(15) };
}

function eichung(R, A, t1, sg) {
  var f = fensterNach('W-Nach'), g = K1.fensterTage(R, f), ev = K.liste(R, A.A1, g[0], g[1]), zellen = {};
  [5, 15].forEach(function (H) {
    var vor = K1.vorwaerts(R, H), c = K1.ereignisSicht(R, ev, vor, K1.kontrolle(R, vor)), s = t1['h' + H];
    zellen['h' + H] = {
      teil2: { n: c.n, mittelBp: c.mittelBp, seBp: c.seBp, t: c.t }, teil1: { n: s.n, mittelBp: s.mittelBp, seBp: s.seBp, t: s.t },
      gleich: c.n === s.n && Math.abs(c.mittelBp - s.mittelBp) <= 1e-9 && Math.abs(c.seBp - s.seBp) <= 1e-9
    };
  });
  var r2 = function (x) { return Math.round(x * 100) / 100; };
  var gerundet = zellen.h5.teil2.n === TEIL1_GERUNDET.n && r2(zellen.h5.teil2.mittelBp) === TEIL1_GERUNDET.h5 && r2(zellen.h15.teil2.mittelBp) === TEIL1_GERUNDET.h15;
  return {
    erstellt: new Date().toISOString(), siegel: sg, teil1Siegel: t1.siegel,
    was: 'A1 (VWAP-Kreuz) gegen Ereignis R1 aus Teil 1: QQQ, W-Nach, H = 5 und 15; Zahl der Ereignisse, Mittel und Standardfehler',
    zellen: zellen, gerundetWieTeil1: gerundet, trifft: zellen.h5.gleich && zellen.h15.gleich && gerundet
  };
}

/* ------------------------------------------------------------------ alles fuer einen Wert */
function rechneWert(E, sym, R, wi, vw, A) {
  if (!vw) vw = K1.vwapReihe(R);
  if (!A) A = K.ausloeser(R, vw);
  E.daten[sym] = { tage: R.tagDatum.length, kerzen: R.n, ersterTag: R.tagDatum[0], letzterTag: R.tagDatum[R.tagDatum.length - 1], ausloeser: A.zaehlung };
  var vor = K.H_LISTE.map(function (H) { return K1.vorwaerts(R, H); });
  var ktr = vor.map(function (v) { return K1.kontrolle(R, v); });
  K1.FENSTER.forEach(function (f, fi) {
    var g = K1.fensterTage(R, f), jahre = R.tagJahr.slice(g[0], g[1]);
    if (g[1] <= g[0]) return;          // nur an Kunstreihen der Tests: Fenster ohne Tag
    /* Ereignis-Sicht (2.3) */
    K.AUSLOESER.forEach(function (name) {
      var ev = K.liste(R, A[name], g[0], g[1]);
      K.H_LISTE.forEach(function (H, hi) {
        var c = K1.ereignisSicht(R, ev, vor[hi], ktr[hi]);
        E.ereignisse.push({ wert: sym, ausloeser: name, fenster: f.name, H: H, signale: ev.length, n: c.n, tage: c.tage, mittelBp: c.mittelBp, rohBp: c.rohBp, seBp: c.seBp, t: c.t });
      });
    });
    /* Struktur-Sicht (2.4 bis 2.9) */
    var alleImFenster = 0;
    for (var i = R.tagA[g[0]]; i < R.tagE[g[1] - 1]; i++) if (A.Alle[i]) alleImFenster++;
    var kand = K.kandidatenZ2(R, g[0], g[1]), p = alleImFenster / kand;
    var b = K.kennzahlen(K.bot(R, A.Alle, g[0], g[1]), jahre);
    var z1 = K.kontrolleZ1(R, A.Alle, g[0], g[1], 89210000 + 100 * wi + 10 * fi, K.WIEDERHOLUNGEN, jahre);
    var z2 = K.kontrolleZ2(R, g[0], g[1], p, 89220000 + 100 * wi + 10 * fi, K.WIEDERHOLUNGEN, jahre);
    E.struktur.push({
      wert: sym, fenster: f.name, tage: g[1] - g[0], alleAusloeser: alleImFenster, alleJeTag: alleImFenster / (g[1] - g[0]), kandidatenZ2: kand, pZ2: p,
      saatZ1: 89210000 + 100 * wi + 10 * fi, saatZ2: 89220000 + 100 * wi + 10 * fi, bot: b, z1: z1, z2: z2, satz: K.satzStruktur(b.rJeTrade, z1.q975.rJeTrade)
    });
  });
}

/* ------------------------------------------------------------------ Zahlen als Text */
function z(x, n) { return (x !== x || x == null) ? 'n. v.' : x.toFixed(n).replace('.', ',').replace('-', '−'); }
function vz(x, n) { return (x !== x || x == null) ? 'n. v.' : (x > 0 ? '+' : '') + z(x, n); }
function pz(x, n) { return (x !== x || x == null) ? 'n. v.' : z(x * 100, n == null ? 0 : n) + ' %'; }
function gz(x) { return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function tagText(d) { return d.slice(8, 10) + '.' + d.slice(5, 7) + '.' + d.slice(0, 4); }
function spanne(v, k, fmt) { return fmt(v.median[k]) + ' [' + fmt(v.q025[k]) + '; ' + fmt(v.q975[k]) + ']'; }

function zelle(E, wert, ausl, fenster, H) {
  return E.ereignisse.filter(function (x) { return x.wert === wert && x.ausloeser === ausl && x.fenster === fenster && x.H === H; })[0];
}
function struktur(E, wert, fenster) { return E.struktur.filter(function (x) { return x.wert === wert && x.fenster === fenster; })[0]; }

function satzZeileEreignis(E) {
  var c = zelle(E, HAUPT.wert, HAUPT.ausloeser, HAUPT.fenster, HAUPT.H), f = fensterNach(HAUPT.fenster);
  return '**Ereignis-Sicht: ' + K.satzEreignis(c.mittelBp, c.t) + '** (Hauptzelle QQQ, „Alle", H = 5, ' + tagText(f.von) + '–' + tagText(f.bis) + '): Mittel ' +
    vz(c.mittelBp, 2) + ' Basispunkte gegenüber der Kontrolle, Standardfehler ' + z(c.seBp, 2) + ', t ' + vz(c.t, 2) + ' (' + gz(c.n) + ' Ereignisse an ' + gz(c.tage) +
    ' Tagen); geschätzte Hürde 1,0 Basispunkte (Schätzung des PM, nicht gemessen).';
}

function zeileBot(s) {
  var b = s.bot;
  return 'Bot: ' + vz(b.rJeTrade, 3) + ' R je Trade (t ' + vz(b.t, 2) + '), ' + pz(b.anteilGruen) + ' grüne Tage, schlechtester Tag ' + vz(b.schlechtesterTagR, 2) + ' R';
}
function zeileKontrolle(titel, v) {
  return titel + ': ' + spanne(v, 'rJeTrade', function (x) { return vz(x, 3); }) + ' R je Trade, ' + spanne(v, 'anteilGruen', function (x) { return pz(x); }) +
    ' grüne Tage, 23 grüne Tage in Folge in ' + spanne(v, 'anteilBloeckeGruen', function (x) { return pz(x); }) + ' der Blöcke';
}

function satzZeileStruktur(E) {
  var s = struktur(E, 'QQQ', 'W-Nach'), f = fensterNach('W-Nach');
  return '**Struktur-Sicht: ' + s.satz + '** (QQQ, ' + tagText(f.von) + '–' + tagText(f.bis) + '; Bot ' + vz(s.bot.rJeTrade, 3) + ' R je Trade gegen 97,5-%-Stelle der Zufallsrichtung ' +
    vz(s.z1.q975.rJeTrade, 3) + ' R). ' + zeileBot(s) + ' · ' + zeileKontrolle('Zufallsrichtung', s.z1) + ' · ' + zeileKontrolle('Zufallszeit', s.z2) +
    ' (Kontrollen: Median [2,5 %; 97,5 %] über je 200 Wiederholungen).';
}

function bericht(E) {
  var f = fensterNach('W-Nach'), zeilen = [];
  zeilen.push(satzZeileEreignis(E));
  zeilen.push('');
  zeilen.push(satzZeileStruktur(E));
  zeilen.push('');
  zeilen.push('# Ergebnis Auftrag Nr. 89R-2: die drei Auslöser aus dem Reel und seine Ausstiegsstruktur (QQQ, SPY, IWM, Minutenkerzen)');
  zeilen.push('');
  zeilen.push('**Ereignis-Sicht QQQ, ' + tagText(f.von) + '–' + tagText(f.bis) + '** — Ertrag in Signalrichtung ab der nächsten Eröffnung über H Minuten, abzüglich des Mittels derselben Tagesminute im selben Kalenderjahr; Basispunkte, in Klammern t (Standardfehler über Tage gebündelt). Hauptzelle fett, alles andere nachrichtlich.');
  zeilen.push('');
  zeilen.push('| Auslöser | Ereignisse (H = 5) | H = 1 | H = 2 | H = 3 | H = 5 | H = 10 | H = 15 |');
  zeilen.push('|---|---|---|---|---|---|---|---|');
  var titel = { A1: 'A1 VWAP-Kreuz', A1f: 'A1f VWAP-Kreuz mit Filter', A2: 'A2 EMA-50-Kreuz', A3: 'A3 Ausbruch 15 Min.', Alle: 'Alle (A1f + A2 + A3)' };
  K.AUSLOESER.forEach(function (a) {
    var hs = K.H_LISTE.map(function (H) {
      var c = zelle(E, 'QQQ', a, 'W-Nach', H), t = vz(c.mittelBp, 2) + ' (' + vz(c.t, 1) + ')';
      return a === HAUPT.ausloeser && H === HAUPT.H ? '**' + t + '**' : t;
    });
    zeilen.push('| ' + titel[a] + ' | ' + gz(zelle(E, 'QQQ', a, 'W-Nach', 5).n) + ' | ' + hs.join(' | ') + ' |');
  });
  var nach = E.ereignisse.filter(function (x) { return x.fenster === 'W-Nach'; }), ueber2 = nach.filter(function (x) { return Math.abs(x.t) >= 2; });
  var groesst = nach.reduce(function (m, x) { return Math.abs(x.t) > Math.abs(m.t) ? x : m; }, nach[0]);
  zeilen.push('');
  zeilen.push('Im Urteilsfenster ' + nach.length + ' Zellen (3 Werte × 5 Auslöser × 6 H): ' + ueber2.length + ' mit |t| ≥ 2 (bei reinem Zufall im Mittel etwa ' + z(0.0455 * nach.length, 1) +
    '); größtes |t| ' + vz(groesst.t, 2) + ' (' + groesst.wert + ', ' + groesst.ausloeser + ', H = ' + groesst.H + '); für ' + nach.length + ' Zellen läge die Schwelle nach Bonferroni bei |t| ≥ ' +
    z(K.bonferroni(nach.length), 2) + '. Eichung: A1 trifft Ereignis R1 aus Teil 1 (' + gz(E.eichung.zellen.h5.teil2.n) + ' Ereignisse; H = 5 ' + vz(E.eichung.zellen.h5.teil2.mittelBp, 2) + ', H = 15 ' +
    vz(E.eichung.zellen.h15.teil2.mittelBp, 2) + ' Basispunkte, gleich bis 10⁻⁹).');
  zeilen.push('');
  zeilen.push('**Struktur-Sicht, ' + tagText(f.von) + '–' + tagText(f.bis) + '** — R = 17 % der Prämie (der Stopp), nach Kosten; Kontrollen als Median, wo angegeben [2,5 %; 97,5 %] über 200 Wiederholungen. Grüne Tage, Serien, Blöcke und Tagesextreme nur über Tage mit mindestens einem Trade. QQQ ist die Urteilszeile, SPY und IWM nachrichtlich.');
  zeilen.push('');
  zeilen.push('| Wert | Lauf | Trades/Tag | Treffer | Ø Gewinn R | Ø Verlust R | R je Trade (t) | R je Tag | grüne Tage | längste grüne Serie | 23er-Blöcke ganz grün | schlechtester Tag R | bester Tag R | Summe R | größter Rückschlag R |');
  zeilen.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  D.WERTE.forEach(function (sym) {
    var s = struktur(E, sym, 'W-Nach'), b = s.bot;
    zeilen.push('| ' + sym + ' | Bot | ' + z(b.tradesJeTag, 1) + ' | ' + pz(b.trefferquote) + ' | ' + vz(b.mittlererGewinnR, 2) + ' | ' + vz(b.mittlererVerlustR, 2) + ' | ' + vz(b.rJeTrade, 3) + ' (' + vz(b.t, 1) +
      ') | ' + vz(b.rJeTag, 2) + ' | ' + pz(b.anteilGruen) + ' | ' + b.laengsteSerie + ' | ' + b.bloeckeAlleGruen + ' von ' + b.bloecke + ' | ' + vz(b.schlechtesterTagR, 2) + ' | ' + vz(b.besterTagR, 2) +
      ' | ' + vz(b.summeR, 1) + ' | ' + z(b.rueckschlagR, 1) + ' |');
    [['Zufallsrichtung', s.z1], ['Zufallszeit', s.z2]].forEach(function (paar) {
      var v = paar[1], m = v.median;
      zeilen.push('| ' + sym + ' | ' + paar[0] + ' | ' + z(m.tradesJeTag, 1) + ' | ' + pz(m.trefferquote) + ' | ' + vz(m.mittlererGewinnR, 2) + ' | ' + vz(m.mittlererVerlustR, 2) + ' | ' +
        spanne(v, 'rJeTrade', function (x) { return vz(x, 3); }) + ' | ' + vz(m.rJeTag, 2) + ' | ' + spanne(v, 'anteilGruen', function (x) { return pz(x); }) + ' | ' + z(m.laengsteSerie, 0) + ' | ' +
        spanne(v, 'anteilBloeckeGruen', function (x) { return pz(x); }) + ' | ' + vz(m.schlechtesterTagR, 2) + ' | ' + vz(m.besterTagR, 2) + ' | ' + vz(m.summeR, 1) + ' | ' + z(m.rueckschlagR, 1) + ' |');
    });
  });
  zeilen.push('');
  zeilen.push('Nachrichtlich: SPY — ' + struktur(E, 'SPY', 'W-Nach').satz + '; IWM — ' + struktur(E, 'IWM', 'W-Nach').satz + ' (gleiche Regel, nicht Teil des Urteils).');
  zeilen.push('');
  zeilen.push('**Annahmen (alle vom PM gesetzt, nicht gemessen):**');
  zeilen.push('');
  ['Filter „zusammengedrückt" bei |EMA 9 − EMA 21| < 0,5 × ATR (das Reel nennt keine Zahl).', '5 Minuten Pause nach jedem Ausstieg („waits a moment").',
    'Stopp bei 17 % der Prämie (≈ 1.250 $ bei 20 Optionen zu 3,69 $; der Autor sagt nur „based on ATR").', 'Gewinnsicherung scharf ab +6 % der Prämie, Verkauf bei 40 % Rückgabe.',
    'Tagesbremse bei +1,44 R (1.800 $ / 1.250 $), keine Verlustbremse.', 'Option = Basiswert mit Delta 0,5, ohne Gamma, ohne Zeitwertverlust; Prämie 0,49 % des Kurses.',
    'Kosten 1 % der Prämie je Trade hin und zurück.', 'Hürde der Ereignis-Sicht 1,0 Basispunkte je Trade hin und zurück.',
    'Zufallszeit: Wahrscheinlichkeit je Kerze 09:45–15:44 so, dass im Mittel so viele Auslöser je Tag entstehen wie bei „Alle".'
  ].forEach(function (a) { zeilen.push('- ' + a); });
  zeilen.push('');
  zeilen.push('**Grenzen.** Optionskurse fehlen: Gemessen ist der Basiswert, die Option ist über ihn genähert; Gamma, Zeitwertverlust und die echte Spanne einer Option mit einem Tag Laufzeit fehlen. ' +
    'Innerhalb einer Minutenkerze ist der Kursweg unbekannt; die Regel nimmt den ungünstigen Fall zuerst (Stopp vor Gewinnsicherung) und füllt Ausstiege genau am Stoppkurs bzw. an der Marke, ohne Rutsch. ' +
    'Das Zweite ist zu günstig: an Kunstreihen ohne Kosten +0,009 R je Trade bei 60 Teilschritten je Minute, +0,066 R bei Kerzen ohne Docht (REGEL.md Teil C); für echte Minutenkerzen nicht gemessen. ' +
    'Beides trifft Bot und Kontrollen gleich, der Vergleich bleibt; die absoluten R-Zahlen tragen den Fehler. ' +
    'Einstieg zur nächsten Eröffnung ohne Rutsch; Kosten allein über die 1 % der Prämie. Eine Hauptzelle und ein Struktur-Satz; die übrigen Zellen und Werte stehen nachrichtlich daneben. Kurse roh (SIP). ' +
    'Datenlücken gehandelt, wie sie sind (Teil 1, REGEL.md C). ' + (E.korrekturen || []).map(function (k) { return k.kurz + ' '; }).join('') +
    'Beschreibende Zahlen nach vorher festgelegter Regel (REGEL.md, Siegel ' + E.siegel.commit + '); gemessen werden Regeln, keine Aussage über Personen; keine Anlageberatung.');
  zeilen.push('');
  return zeilen.join('\n');
}

/* ------------------------------------------------------------------ der Lauf */
function hauptlauf(sg) {
  var t0 = Date.now(), t1 = teil1Zellen();
  var E = {
    erstellt: new Date().toISOString(), siegel: sg, hauptzelle: HAUPT, fenster: K1.FENSTER, h: K.H_LISTE, wiederholungen: K.WIEDERHOLUNGEN,
    konstanten: { stopp: K.STOPP, scharf: K.SCHARF, kosten: K.KOSTEN, rueckfall: K.RUECKFALL, bremseR: K.BREMSE_R, filter: K.FILTER, abkuehlung: K.ABKUEHLUNG, huerdeBp: K.HUERDE_BP },
    eichung: null, daten: {}, ereignisse: [], struktur: [], vollstaendig: false,
    korrekturen: [{
      nr: 1, erstesSiegel: 'd18cc2c',
      fehler: 'Bericht (ERGEBNIS.md) nicht in der Form aus Paragraph 4: die Annahmen standen als Fliesstext statt als Liste; die Grenzen nannten nur die unguenstige Seite der Kerzenregel, nicht die vor dem Siegel gefundene guenstige (Fuellung genau an der Marke, REGEL.md Teil C); erste Zeile sagte "ueber der Kontrolle" bei negativem Mittel.',
      gefunden: 'beim Lesen von ERGEBNIS.md nach dem ersten Lauf unter Siegel d18cc2c.',
      behoben: 'nur der Berichtstext in lauf.js (Funktion bericht); keine Rechnung geaendert.',
      wirkung: 'keine Zahl; Vergleich aller Zahlenfelder von ergebnis.json gegen den ersten Lauf in vergleich-korrektur.log.',
      kurz: 'Eine Korrektur nach dem ersten Lauf, nur am Berichtstext (Annahmen als Liste, Grenze zur Füllung ergänzt); alle Zahlen gleich (REGEL.md Teil D).'
    }]
  };
  D.WERTE.forEach(function (sym, wi) {
    var R = D.ladeWert(sym).reihe, vw = K1.vwapReihe(R), A = K.ausloeser(R, vw);
    console.log(sym + ' geladen (' + R.n + ' Kerzen, ' + R.tagDatum.length + ' Tage) nach ' + Math.round((Date.now() - t0) / 1000) + ' s');
    if (sym === 'QQQ') {
      E.eichung = eichung(R, A, t1, sg);
      fs.writeFileSync(path.join(ORDNER, 'eichung.json'), JSON.stringify(E.eichung, null, 1));
      if (!E.eichung.trifft) {
        console.log('EICHUNG TRIFFT TEIL 1 NICHT - anhalten, Ursache suchen, nichts anpassen, melden. Siehe eichung.json.');
        process.exit(2);
      }
      console.log('Eichung trifft Teil 1.');
    }
    rechneWert(E, sym, R, wi, vw, A);
    fs.writeFileSync(path.join(ORDNER, 'ergebnis.json'), JSON.stringify(E, null, 1));     // Zwischenstand
    console.log(sym + ' gerechnet nach ' + Math.round((Date.now() - t0) / 1000) + ' s');
  });
  E.vollstaendig = true;
  E.dauerSekunden = Math.round((Date.now() - t0) / 1000);
  fs.writeFileSync(path.join(ORDNER, 'ergebnis.json'), JSON.stringify(E, null, 1));
  var text = bericht(E);
  fs.writeFileSync(path.join(ORDNER, 'ERGEBNIS.md'), text);
  console.log('Ereignis-Zellen: ' + E.ereignisse.length + ', Struktur-Zeilen: ' + E.struktur.length);
  console.log(text);
}

if (require.main === module) hauptlauf(siegel());
module.exports = { rechneWert: rechneWert, bericht: bericht, eichung: eichung, HAUPT: HAUPT };
