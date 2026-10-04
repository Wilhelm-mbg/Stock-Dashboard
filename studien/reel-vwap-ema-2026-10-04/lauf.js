'use strict';
/* Auftrag Nr. 89 (Reel-Strategien, Teil 1) - der Lauf.
 *   node studien/reel-vwap-ema-2026-10-04/lauf.js --eichung   Eichung am Papier (2.10), schreibt eichung.json
 *   node studien/reel-vwap-ema-2026-10-04/lauf.js             alle Laeufe (2.7) und die Ereignis-Sicht (2.8),
 *                                                              schreibt ergebnis.json und ERGEBNIS.md
 * Beide weigern sich, solange REGEL.md, Code und Tests nicht committet sind (Siegel). Der Hauptlauf weigert sich
 * ausserdem, solange die Eichung fehlt oder ausserhalb des Rahmens liegt. Liest E: nur, schreibt nur in diesen Ordner. */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var cp = require('child_process');
var D = require('./daten');
var K = require('./kern');

var ORDNER = __dirname;
var SIEGEL_DATEIEN = ['REGEL.md', 'daten.js', 'kern.js', 'lauf.js', 'test.js'];
var PAPIER = { gesamt: 6.71, trades: 21967, trefferquote: 0.17, rueckschlag: 0.094, sharpe: 2.1 };
var RAHMEN = { trades: [20000, 24000], trefferquote: [0.15, 0.19], gesamt: [3, 12] };
var REGELN = [{ name: 'R1', titel: 'VWAP-Trend', ausNull: false }, { name: 'R2', titel: 'EMA-Stapel', ausNull: true }];
var HAUPT = { regel: 'R1', wert: 'QQQ', fassung: 'N', fenster: 'W-Nach' };

function siegel() {
  var wurzel = path.resolve(ORDNER, '..', '..');
  var pfade = SIEGEL_DATEIEN.map(function (d) { return 'studien/' + path.basename(ORDNER) + '/' + d; });
  var status = cp.execFileSync('git', ['status', '--porcelain', '--'].concat(pfade), { cwd: wurzel, encoding: 'utf8' }).trim();
  if (status) {
    console.log('Siegel fehlt - diese Dateien sind nicht committet:\n' + status);
    process.exit(3);
  }
  var hashes = {};
  SIEGEL_DATEIEN.forEach(function (d) { hashes[d] = crypto.createHash('sha256').update(fs.readFileSync(path.join(ORDNER, d))).digest('hex').slice(0, 16); });
  var letzter = cp.execFileSync('git', ['log', '-1', '--format=%h', '--'].concat(pfade), { cwd: wurzel, encoding: 'utf8' }).trim();
  return { commit: letzter, sha256: hashes };
}

function jahreVon(R, d0, d1) { return R.tagJahr.slice(d0, d1); }
function fensterNach(name) { return K.FENSTER.filter(function (f) { return f.name === name; })[0]; }
function kostenNach(name) { return K.KOSTEN.filter(function (k) { return k.name === name; })[0]; }

/* ------------------------------------------------------------------ Eichung (2.10) */
function eichung(sg) {
  var R = D.ladeWert('QQQ').reihe, vw = K.vwapReihe(R), s1 = K.zustandR1(R, vw);
  var f = fensterNach('W-Papier'), g = K.fensterTage(R, f);
  var kz = K.kennzahlen(K.simuliere(R, s1, g[0], g[1], 'P', kostenNach('Papier')), jahreVon(R, g[0], g[1]));
  var drin = function (x, r) { return x >= r[0] && x <= r[1]; };
  var imRahmen = drin(kz.trades, RAHMEN.trades) && drin(kz.trefferquote, RAHMEN.trefferquote) && drin(kz.gesamt, RAHMEN.gesamt);
  var aus = {
    erstellt: new Date().toISOString(), siegel: sg, lauf: 'R1, QQQ, Fassung P, Kosten Papier (0,0005 $ je Aktie), ' + f.von + ' bis ' + f.bis,
    papier: PAPIER, rahmen: RAHMEN, imRahmen: imRahmen,
    ergebnis: { tage: kz.tage, gesamt: kz.gesamt, trades: kz.trades, tradesJeTag: kz.tradesJeTag, trefferquote: kz.trefferquote, rueckschlag: kz.rueckschlag, sharpe: kz.sharpe, pa: kz.pa, jahre: kz.jahre }
  };
  fs.writeFileSync(path.join(ORDNER, 'eichung.json'), JSON.stringify(aus, null, 1));
  console.log('Eichung am Papier: ' + eichungSatz(aus));
  console.log(imRahmen ? 'IM RAHMEN - der Lauf darf starten.' : 'AUSSERHALB DES RAHMENS - anhalten, Ursache suchen, nichts anpassen, melden.');
  process.exit(imRahmen ? 0 : 2);
}

/* ------------------------------------------------------------------ Zahlen als Text */
function z(x, n) { return (x !== x || x == null) ? 'n. v.' : x.toFixed(n).replace('.', ',').replace('-', '−'); }
function pz(x, n) { return (x !== x || x == null) ? 'n. v.' : (x > 0 ? '+' : '') + z(x * 100, n == null ? 1 : n) + ' %'; }
function vz(x, n) { return (x !== x || x == null) ? 'n. v.' : (x > 0 ? '+' : '') + z(x, n); }
function gz(x) { return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function tagText(d) { return d.slice(8, 10) + '.' + d.slice(5, 7) + '.' + d.slice(0, 4); }

function eichungSatz(e) {
  var r = e.ergebnis;
  return 'Gesamtertrag ' + pz(r.gesamt, 0) + ' (Papier +671 %), ' + gz(r.trades) + ' Trades (rund 21.967), Trefferquote ' + z(r.trefferquote * 100, 1) +
    ' % (rund 17 %), größter Rückschlag ' + z(r.rueckschlag * 100, 1) + ' % (9,4 %), Sharpe ' + z(r.sharpe, 2) + ' (2,1), ' + r.tage + ' Handelstage — ' +
    (e.imRahmen ? 'im Rahmen' : 'AUSSERHALB des Rahmens') + ' (Trades 20.000–24.000, Trefferquote 15–19 %, Gesamtertrag +300 % bis +1.200 %).';
}

function satzText(l) {
  var k0 = l.kosten['0'], k25 = l.kosten['0,25'], k10 = l.kosten['1,0'];
  return '**' + l.satz + '** — mittlerer Tagesertrag bei c = 0: ' + vz(k0.mittelTagBp, 2) + ' Basispunkte (t ' + vz(k0.t, 2) + '), bei c = 0,25: ' +
    vz(k25.mittelTagBp, 2) + ' Basispunkte (t ' + vz(k25.t, 2) + '); verträgt Kosten bis c* = ' + z(l.cStern, 2) + ' Basispunkte je Seite' +
    (l.cStern <= 0 ? ' (nicht über null: schon ohne Kosten kein Überschuss)' : '') + '; bei geschätzten 1,0 Basispunkten je Seite bleibt ' + pz(k10.pa) +
    ' p. a. (Hürde geschätzt, nicht gemessen)';
}

function bericht(E) {
  var nachN = E.laeufe.filter(function (l) { return l.fenster === 'W-Nach' && l.fassung === 'N'; });
  var haupt = nachN.filter(function (l) { return l.regel === HAUPT.regel && l.wert === HAUPT.wert; })[0];
  var f = fensterNach('W-Nach'), zeilen = [];
  zeilen.push('# Ergebnis Auftrag Nr. 89: VWAP-Trend und EMA-Stapel auf QQQ, SPY, IWM');
  zeilen.push('');
  zeilen.push('**Hauptlauf (R1 „VWAP-Trend", QQQ, Fassung N, ' + tagText(f.von) + '–' + tagText(f.bis) + ', ' + haupt.tage + ' Handelstage):** ' + satzText(haupt) +
    '. Ohne Kosten ' + pz(haupt.kosten['0'].pa) + ' p. a., bei c = 0,25 ' + pz(haupt.kosten['0,25'].pa) + ' p. a.; ' + z(haupt.kosten['0'].tradesJeTag, 1) +
    ' Trades je Tag, Tagesumsatz das ' + z(haupt.kosten['0'].tagesumsatz, 1) + '-Fache des Vermögens; Kaufen-und-Halten im selben Fenster ' + pz(haupt.kaufenHalten.pa) +
    ' p. a. (Kursertrag, ohne Ausschüttungen).');
  zeilen.push('');
  zeilen.push('**Eichung am Papier** (R1, QQQ, Fassung P, Kosten „Papier", 02.01.2018–28.09.2023): ' + eichungSatz(E.eichung));
  zeilen.push('');
  zeilen.push('**Fenster W-Nach (' + tagText(f.von) + '–' + tagText(f.bis) + '), Fassung N** — ein Hauptlauf (erste Zeile), die anderen fünf Zeilen nachrichtlich:');
  zeilen.push('');
  zeilen.push('| Regel | Wert | Satz | p. a. c=0 | p. a. c=0,25 | p. a. c=1,0 | t c=0 | t c=0,25 | c* (Bp) | Trades/Tag | größter Rückschlag c=0,25 | Kaufen-und-Halten p. a. |');
  zeilen.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
  REGELN.forEach(function (rg) {
    D.WERTE.forEach(function (sym) {
      var l = nachN.filter(function (x) { return x.regel === rg.name && x.wert === sym; })[0];
      zeilen.push('| ' + rg.name + ' ' + rg.titel + ' | ' + sym + ' | ' + l.satz + ' | ' + pz(l.kosten['0'].pa) + ' | ' + pz(l.kosten['0,25'].pa) + ' | ' + pz(l.kosten['1,0'].pa) +
        ' | ' + vz(l.kosten['0'].t, 2) + ' | ' + vz(l.kosten['0,25'].t, 2) + ' | ' + z(l.cStern, 2) + ' | ' + z(l.kosten['0'].tradesJeTag, 1) + ' | ' +
        z(l.kosten['0,25'].rueckschlag * 100, 1) + ' % | ' + pz(l.kaufenHalten.pa) + ' |');
    });
  });
  zeilen.push('');
  zeilen.push('**Ereignis-Sicht** (W-Nach; Ertrag ab der nächsten Eröffnung über H Minuten in Signalrichtung, abzüglich des Tageszeit-Mittels; Basispunkte, in Klammern t über Tage gebündelt):');
  var groesstesT = 0, zellen = 0;
  REGELN.forEach(function (rg) {
    var teile = D.WERTE.map(function (sym) {
      var hs = K.H_LISTE.map(function (H) {
        var c = E.ereignisse.filter(function (x) { return x.regel === rg.name && x.wert === sym && x.fenster === 'W-Nach' && x.H === H; })[0];
        zellen++;
        if (Math.abs(c.t) > Math.abs(groesstesT)) groesstesT = c.t;
        return 'H' + H + ' ' + vz(c.mittelBp, 2) + ' (' + vz(c.t, 1) + ')';
      });
      var n5 = E.ereignisse.filter(function (x) { return x.regel === rg.name && x.wert === sym && x.fenster === 'W-Nach' && x.H === 5; })[0].n;
      return sym + ' [' + gz(n5) + ' Ereignisse]: ' + hs.join(', ');
    });
    zeilen.push('- ' + rg.name + ' (' + (rg.ausNull ? 'Eintritt in long oder short' : 'Seitenwechsel am VWAP') + '): ' + teile.join(' · ') + '.');
  });
  zeilen.push('- Einordnung: ' + zellen + ' Zellen im Urteilsfenster, größtes t dem Betrag nach ' + vz(groesstesT, 1) + '; bei ' + zellen +
    ' Zellen läge die Schwelle nach Bonferroni bei |t| ≈ 3,1. Die Zellen sind beschreibend, kein Urteil.');
  zeilen.push('');
  zeilen.push('**Grenzen.** Gemessen ist der Basiswert, nicht die Option: Optionskurse fehlen, die Options-Hürde von 1,0 Basispunkten je Seite ist vom PM geschätzt, nicht gemessen. ' +
    'Fassung P ist nicht ausführbar und dient nur der Eichung; Fassung N handelt zur nächsten Eröffnung ohne Spanne, Kosten gehen allein über c ein. ' +
    'Short ohne Leihgebühr, kein Zins auf Bargeld, Bruchstücke erlaubt, kein Hebel. R2 ist ein Nachbau der im Reel genannten Zutaten durch den PM, nicht die Regel aus dem Reel. ' +
    'Ein Hauptlauf; die elf Nebenläufe im Urteilsfenster stehen nachrichtlich daneben und zählen nicht als weitere Belege. Kurse roh (SIP), Kaufen-und-Halten ohne Ausschüttungen. ' +
    'Datenlücken wurden gehandelt, wie sie sind: ' + E.datenluecken + ' Beschreibende Zahlen nach vorher festgelegter Regel (REGEL.md, Siegel ' + E.siegel.commit + '); keine Anlageberatung.');
  zeilen.push('');
  return zeilen.join('\n');
}

/* ------------------------------------------------------------------ alle Laeufe (2.7) und Ereignis-Sicht (2.8) */
function hauptlauf(sg) {
  var eichPfad = path.join(ORDNER, 'eichung.json');
  if (!fs.existsSync(eichPfad)) { console.log('Eichung fehlt - zuerst: lauf.js --eichung'); process.exit(2); }
  var eich = JSON.parse(fs.readFileSync(eichPfad, 'utf8'));
  if (!eich.imRahmen) { console.log('Eichung ausserhalb des Rahmens - der Lauf startet nicht.'); process.exit(2); }
  if (eich.siegel.commit !== sg.commit) { console.log('Eichung stammt von einem anderen Siegel (' + eich.siegel.commit + ' gegen ' + sg.commit + ') - Eichung wiederholen.'); process.exit(2); }

  var E = {
    erstellt: new Date().toISOString(), siegel: sg, eichung: eich, hauptlauf: HAUPT, start: K.START,
    fenster: K.FENSTER, kostenleiter: K.KOSTEN, daten: {}, laeufe: [], ereignisse: [], korrekturen: [],
    datenluecken: 'QQQ am 02. und 03.05.2018 nur die Kerze 09:30 (kein Handel an diesen Tagen), QQQ am 22.02.2016 340 Kerzen, SPY und IWM am 12.08.2019 nur bis 15:31 bzw. 15:30, vier Tage im März 2020 je 376 Kerzen (Handelsunterbrechung).'
  };
  D.WERTE.forEach(function (sym) {
    var R = D.ladeWert(sym).reihe;
    rechneWert(E, sym, R);
    console.log(sym + ' gerechnet (' + R.n + ' Kerzen, ' + R.tagDatum.length + ' Tage).');
  });
  fs.writeFileSync(path.join(ORDNER, 'ergebnis.json'), JSON.stringify(E, null, 1));
  var text = bericht(E);
  fs.writeFileSync(path.join(ORDNER, 'ERGEBNIS.md'), text);
  console.log('Laeufe: ' + E.laeufe.length + ' x ' + K.KOSTEN.length + ' Kostenstufen, Ereignis-Zellen: ' + E.ereignisse.length);
  console.log(text);
}

/** Alle Laeufe und Ereignis-Zellen eines Werts; haengt sie an E.laeufe und E.ereignisse. */
function rechneWert(E, sym, R) {
  if (R.n > 0) {
    var vw = K.vwapReihe(R);
    var zust = { R1: K.zustandR1(R, vw), R2: K.zustandR2(R, vw) };
    var zaehl = { '1': 0, '0': 0, '-1': 0 };
    for (var i = 0; i < R.n; i++) zaehl[String(zust.R2[i])]++;
    E.daten[sym] = { tage: R.tagDatum.length, kerzen: R.n, ersterTag: R.tagDatum[0], letzterTag: R.tagDatum[R.tagDatum.length - 1], gleichstaendeSchlussVwap: zust.R1.gleichstaende, zustaendeR2: zaehl };
    var vorH = K.H_LISTE.map(function (H) { return K.vorwaerts(R, H); });
    var ktrH = vorH.map(function (v) { return K.kontrolle(R, v); });
    REGELN.forEach(function (rg) {
      var s = zust[rg.name];
      K.FENSTER.forEach(function (f) {
        var g = K.fensterTage(R, f), jahre = jahreVon(R, g[0], g[1]);
        ['P', 'N'].forEach(function (fassung) {
          var l = { regel: rg.name, wert: sym, fassung: fassung, fenster: f.name, tage: g[1] - g[0], kaufenHalten: K.kaufenHalten(R, g[0], g[1]), kosten: {} };
          K.KOSTEN.forEach(function (k) {
            var sim = K.simuliere(R, s, g[0], g[1], fassung, k);
            if (k.name === '0') l.cStern = K.kostengrenze(sim);
            l.kosten[k.name] = K.kennzahlen(sim, jahre);
          });
          if (f.name === 'W-Nach' && fassung === 'N') l.satz = K.satz(l.kosten['0'].mittelTagBp, l.kosten['0'].t, l.kosten['0,25'].mittelTagBp, l.kosten['0,25'].t);
          E.laeufe.push(l);
        });
        var liste = K.ereignisse(R, s, rg.ausNull, g[0], g[1]);
        K.H_LISTE.forEach(function (H, hi) {
          var c = K.ereignisSicht(R, liste, vorH[hi], ktrH[hi]);
          E.ereignisse.push({ regel: rg.name, wert: sym, fenster: f.name, H: H, n: c.n, tage: c.tage, mittelBp: c.mittelBp, rohBp: c.rohBp, seBp: c.seBp, t: c.t });
        });
      });
    });
  }
}

if (require.main === module) {
  var sg = siegel();
  if (process.argv.indexOf('--eichung') >= 0) eichung(sg); else hauptlauf(sg);
}
module.exports = { bericht: bericht, eichungSatz: eichungSatz, satzText: satzText, rechneWert: rechneWert, REGELN: REGELN };
