'use strict';
/* Auftrag Nr. 96 (04.10.2026): der Momentum-Rueckblick aus Nr. 85 (studien/momentum-korb-kleinst-2026-10-04/) auf dem bereinigten
 * Panel v2.3 (Bau 2c, studien/querschnitt-pruefstand-2026-09-13/voll-v23c/). Dieselbe Regel (REGEL.md von Nr. 85, gesiegelt),
 * derselbe Rechner: kleinst.js (Huelle um mfhandel.js, k0, einLauf, abschluss) -> korb.js (Nr. 78) -> rueckblick.js (Nr. 74).
 * Geaendert ist nur der Datenstand: die Umgebungsvariable RUECKBLICK_PANEL=v2.3, gesetzt HIER vor dem Laden von kleinst.js, stellt
 * in rueckblick.js den Ordner auf voll-v23c und die Kennung auf K.PANEL_KENNUNG_V23 (ohne sie liest alles wie bisher voll-v22).
 * Kein neues Urteil - nur die Verschiebung alt (v2.2, ergebnis.json von Nr. 85) -> neu (v2.3).
 * Die Selbstpruefung von Nr. 85 haelt k = 0 ohne Regel gegen die Endwerte auf v2.2; hier ist sie eine Wiederholbarkeitsprobe:
 * k = 0 ohne Regel vor den Laeufen und noch einmal in den Laeufen, beide auf den Cent (und auf das Bit) gleich.
 *   node --max-old-space-size=6144 studien/momentum-korb-v23-2026-10-04/lauf.js */
process.env.RUECKBLICK_PANEL = 'v2.3';
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var REPO = path.resolve(__dirname, '..', '..');
var NR85 = path.join('studien', 'momentum-korb-kleinst-2026-10-04');
var KS = require(path.join(REPO, NR85, 'kleinst.js'));
var R = KS.R, S = KS.S, MH = KS.MH;
var K = require(path.join(R.PRUEFSTAND, 'konfig.js'));

var KENNUNG = 'momentum-korb-v23-2026-10-04/v1';
var KORREKTUREN = [];
if (R.PANEL_WAHL !== 'v2.3' || path.basename(R.PANEL_ORDNER) !== 'voll-v23c' || !R.PANEL_OPTIONEN || R.PANEL_OPTIONEN.panelKennung !== K.PANEL_KENNUNG_V23) {
  throw new Error('KLINKE: rueckblick.js hat das Panel v2.3 nicht gewaehlt (' + R.PANEL_ORDNER + ')');
}

function cent(x) { return Math.round(x * 100); }
function de(x, n) { return x.toFixed(n == null ? 2 : n).replace('.', ','); }
function vz(x, n) { return (x >= 0 ? '+' : '−') + de(Math.abs(x), n); }
function tsd(x) { return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function dollar(x) { return de(x, 2).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function sha(datei) { return crypto.createHash('sha256').update(fs.readFileSync(path.join(REPO, datei))).digest('hex').slice(0, 16); }
function liesJson(datei) { return JSON.parse(fs.readFileSync(path.join(REPO, datei), 'utf8')); }

/** Selbstpruefung als Wiederholbarkeitsprobe, erster Durchgang: k = 0 ohne Regel durch dieselbe Huelle, alle vier Laeufe. */
function selbstpruefung(V) {
  var alt = KS.sollwerte(), aus = { art: 'Wiederholbarkeitsprobe: k = 0 ohne Regel vor den Laeufen und in den Laeufen, auf den Cent gleich', laeufe: {}, bestanden: null };
  KS.LAEUFE.forEach(function (def) {
    var e = KS.k0(V, def, 0);
    aus.laeufe[def.name] = { buchEnde: e.kz.buchEnde, spyEnde: e.kz.spyEnde, sollBuch: null, sollSpy: null, bestanden: null, umschichtungen: e.L.zaehler.umschichtungen,
      aufrufePlanen: e.aufrufe.plane, aufrufeAusfuehren: e.aufrufe.fuehre, altBuchV22: alt[def.name].buchEnde, altSpyV22: alt[def.name].spyEnde };
    console.log('Selbstpruefung ' + def.name + ' (1. Durchgang): Buch ' + e.kz.buchEnde.toFixed(2) + ', SPY ' + e.kz.spyEnde.toFixed(2) +
      ' (v2.2: ' + alt[def.name].buchEnde.toFixed(2) + ' / ' + alt[def.name].spyEnde.toFixed(2) + ')');
  });
  return aus;
}
/** Zweiter Durchgang = k = 0 ohne Regel aus den Laeufen selbst. */
function wiederholung(SP, laeufe) {
  SP.bestanden = true;
  KS.LAEUFE.forEach(function (def) {
    var s = SP.laeufe[def.name], k = laeufe[def.name].ohne.k0;
    s.sollBuch = k.buchEnde; s.sollSpy = k.spyEnde;
    s.bestanden = cent(s.buchEnde) === cent(k.buchEnde) && cent(s.spyEnde) === cent(k.spyEnde);
    s.bitgleich = s.buchEnde === k.buchEnde && s.spyEnde === k.spyEnde;
    if (!s.bestanden) SP.bestanden = false;
  });
  return SP;
}

/** Nachrichtlich je Lauf: k = 0 mit Regel K noch einmal (dritter Aufruf derselben Huelle) - Reihenenden im Buch nach Grund. */
function reihenenden(V) {
  var aus = {};
  KS.LAEUFE.forEach(function (def) {
    var e = KS.k0(V, def, KS.ANTEIL), jeGrund = {}, total = 0;
    e.L.reihenenden.forEach(function (r) { var g = String(r.grund); jeGrund[g] = (jeGrund[g] || 0) + 1; if (r.totalverlust) total++; });
    aus[def.name] = { buchEnde: e.kz.buchEnde, anzahl: e.L.reihenenden.length, totalverluste: total, nachGrund: jeGrund };
  });
  return aus;
}

/** alt (v2.2, ergebnis.json von Nr. 85) -> neu (v2.3), je Lauf und Fassung. */
var FELDER = [['buchEnde', 'k0'], ['spyEnde', 'k0'], ['buchGesamt', 'k0'], ['spyGesamt', 'k0'], ['abstandPa', 'k0'], ['rueckschlagBuch', 'k0'], ['rueckschlagSpy', 'k0'],
  ['reihenenden', 'k0'], ['vorDemMarkt', 'startphasen'], ['median', 'startphasen'], ['minimum', 'startphasen'], ['maximum', 'startphasen']];
function verschiebung(E, alt) {
  var aus = { alt: { datei: path.join(NR85, 'ergebnis.json').split(path.sep).join('/'), kennung: alt.kennung, panelKennung: alt.panelKennung, erzeugt: alt.erzeugt }, laeufe: {} };
  KS.LAEUFE.forEach(function (def) {
    aus.laeufe[def.name] = {};
    ['ohne', 'mit'].forEach(function (f) {
      var a = alt.laeufe[def.name][f], n = E.laeufe[def.name][f], z = {};
      FELDER.forEach(function (x) { z[x[0]] = { alt: a[x[1]][x[0]], neu: n[x[1]][x[0]], differenz: n[x[1]][x[0]] - a[x[1]][x[0]] }; });
      var gleich = 0, max = 0;
      n.startphasen.abstaende.forEach(function (x, i) { var d = Math.abs(x - a.startphasen.abstaende[i]); if (d === 0) gleich++; if (d > max) max = d; });
      z.abstaende63 = { gleich: gleich, anzahl: n.startphasen.abstaende.length, groessteVerschiebungPp: max };
      aus.laeufe[def.name][f] = z;
    });
  });
  return aus;
}

function ergebnisText(E) {
  var namen = KS.LAEUFE.map(function (l) { return l.name; }), Z = [], VS = E.verschiebung.laeufe;
  function pfeil(f, feld, fmt) { return function (n) { var x = VS[n][f][feld]; return fmt(x.alt) + ' → ' + fmt(x.neu); }; }
  function tabelle(f, titel) {
    Z.push('**' + titel + '** — je Zelle alt (v2.2) → neu (v2.3)');
    Z.push('');
    Z.push('| | ' + namen.map(function (n) { return '**' + n + '**'; }).join(' | ') + ' |');
    Z.push('|---|' + namen.map(function () { return '---'; }).join('|') + '|');
    var zeile = function (t, g) { Z.push('| ' + t + ' | ' + namen.map(g).join(' | ') + ' |'); };
    zeile('Endwert Buch, k = 0', pfeil(f, 'buchEnde', function (x) { return dollar(x) + ' $'; }));
    zeile('Endwert S&P 500, k = 0', pfeil(f, 'spyEnde', function (x) { return dollar(x) + ' $'; }));
    zeile('Gesamtertrag Buch, k = 0', pfeil(f, 'buchGesamt', function (x) { return vz(x, 1) + ' %'; }));
    zeile('**Abstand p. a., k = 0** (Pp)', pfeil(f, 'abstandPa', function (x) { return vz(x, 2); }));
    zeile('Startphasen vorn (von 63)', pfeil(f, 'vorDemMarkt', String));
    zeile('**Median der 63 Abstände** (Pp p. a.)', pfeil(f, 'median', function (x) { return vz(x, 2); }));
    zeile('Minimum / Maximum der Abstände', function (n) { var a = VS[n][f]; return vz(a.minimum.alt, 2) + ' / ' + vz(a.maximum.alt, 2) + ' → ' + vz(a.minimum.neu, 2) + ' / ' + vz(a.maximum.neu, 2); });
    zeile('größter Rückschlag Buch, k = 0', pfeil(f, 'rueckschlagBuch', function (x) { return vz(x, 1) + ' %'; }));
    zeile('Reihenenden im Buch, k = 0', pfeil(f, 'reihenenden', String));
    zeile('von 63 Abständen unverändert (größte Verschiebung)', function (n) { var a = VS[n][f].abstaende63; return a.gleich + ' (' + de(a.groessteVerschiebungPp, 2) + ' Pp)'; });
    Z.push('');
  }
  Z.push('Momentum-Rückblick aus Nr. 85 auf dem bereinigten Panel v2.3 nachgerechnet: dieselbe Regel (Regel K mit 5 %, gesiegelt in Nr. 85), derselbe Rechner ' +
    '(`kleinst.js` → `korb.js` → `mfhandel.js`), geändert ist nur der Datenstand. Keine Bewertung — nur die Verschiebung.');
  Z.push('');
  tabelle('mit', 'Mit Regel K (die Fassung der App)');
  tabelle('ohne', 'Ohne Regel K');
  var RE = E.reihenenden;
  Z.push('**Reihenenden im Buch, mit Regel K, k = 0 (nur v2.3; Hauptregel: Insolvenz und Zwangs-Delisting = Totalverlust).** ' + namen.map(function (n) {
    var g = RE[n].nachGrund;
    return n + ' ' + RE[n].anzahl + ', davon Totalverlust ' + RE[n].totalverluste + ' (' + Object.keys(g).sort().map(function (k) { return k + ' ' + g[k]; }).join(', ') + ')';
  }).join('; ') + '.');
  Z.push('');
  var sp = E.selbstpruefung;
  Z.push('**Wiederholbarkeit.** k = 0 ohne Regel vor den Läufen und in den Läufen gerechnet, auf den Cent: ' + namen.map(function (n) {
    var s = sp.laeufe[n];
    return n + ' ' + dollar(s.buchEnde) + ' $ gegen ' + dollar(s.spyEnde) + ' $ (' + (s.bestanden ? (s.bitgleich ? 'gleich, auch auf das Bit' : 'gleich auf den Cent') : 'NICHT gleich') + ')';
  }).join('; ') + '. Mit Regel K ein dritter Aufruf für k = 0: ' + namen.map(function (n) {
    return n + ' ' + (RE[n].buchEnde === E.laeufe[n].mit.k0.buchEnde ? 'gleich' : 'NICHT gleich');
  }).join(', ') + '. Hülle je Umschichtung genau einmal gerufen (planen und ausführen). Korrekturen: ' + (E.korrekturen.length ? E.korrekturen.length : 'keine') + '.');
  Z.push('');
  Z.push('*Auftrag Nr. 96, Kennung `' + E.kennung + '` (Regel `' + E.regelKennung + '`), Panel `' + E.panelKennung + '` Bau ' + E.panelBau + ' (`' + E.panelOrdner +
    '`), alt = `' + E.verschiebung.alt.datei + '` (Panel `' + E.verschiebung.alt.panelKennung + '`). Fenster, Korb, Kosten (20 Bp je Seite), 63 Startphasen, ' +
    'Reihenenden nach der Hauptregel und Ausschüttungen wie in Nr. 78/85. Alle Zahlen, Zähler und die 63 Abstände in `ergebnis.json`. Alles Simulation, keine Anlageberatung.*');
  return Z.join('\n') + '\n';
}

function lauf() {
  var t0 = Date.now();
  var V = KS.vorbereitung();
  if (V.T.stand.kennung !== K.PANEL_KENNUNG_V23 || V.T.stand.bau !== '2c') throw new Error('KLINKE: gelesen wurde nicht v2.3 Bau 2c, sondern ' + V.T.stand.kennung + ' ' + V.T.stand.bau);
  console.log('Panel ' + V.T.stand.kennung + ' Bau ' + V.T.stand.bau + ', ' + V.T.g.n + ' Zeilen, ' + V.T.nSym + ' Reihen, letzter Tag ' + V.T.kal.tage[V.T.maxTag]);
  var SP = selbstpruefung(V);
  var git = '';
  try { git = require('child_process').execSync('git rev-parse --short HEAD', { cwd: REPO }).toString().trim(); } catch (e) { git = 'unbekannt'; }
  var E = {
    kennung: KENNUNG, vollstaendig: false, erzeugt: new Date().toISOString(), panelKennung: V.T.stand.kennung, panelStand: V.T.stand.stand, gitHead: git,
    regelKennung: KS.KENNUNG, panelBau: V.T.stand.bau, panelOrdner: path.relative(REPO, R.PANEL_ORDNER).split(path.sep).join('/'),
    quellen: { 'mfhandel.js': sha('mfhandel.js'), 'momentum.js': sha('momentum.js'), 'liquide.js': sha('liquide.js'), 'korb.js': sha(path.join('studien', 'momentum-korb-2026-10-04', 'korb.js')),
      'rueckblick.js': sha(path.join('studien', 'massstab-rueckblick-2026-10-04', 'rueckblick.js')), 'kleinst.js': sha(path.join(NR85, 'kleinst.js')),
      'lauf.js': sha(path.join('studien', 'momentum-korb-v23-2026-10-04', 'lauf.js')) },
    regel: { kleinstAnteil: KS.ANTEIL, pruefmarkePp: KS.MARKE_PP, vollAb: KS.VOLL_AB, korbN: S.KORB_N, kostenBpJeSeite: R.KOSTEN_BP, startkapital: R.START, startphasen: R.PHASEN, fenster: S.FENSTER,
      konfigBuch: MH.buchKonfig(), massstab: R.MASSSTAB },
    selbstpruefung: SP, schlusssatz: null, pruefmarke: null, saetze: {}, laeufe: {}, vergleich: null, korrekturen: KORREKTUREN, laufzeitSekunden: 0,
  };
  var datei = path.join(__dirname, 'ergebnis.json');
  KS.LAEUFE.forEach(function (def) {
    var t1 = Date.now();
    var l = KS.einLauf(V, def);
    l.laufzeitSekunden = Math.round((Date.now() - t1) / 100) / 10;
    E.laeufe[def.name] = l;
    E.laufzeitSekunden = Math.round((Date.now() - t0) / 100) / 10;
    fs.writeFileSync(datei, JSON.stringify(E, null, 1));                    /* Zwischenstand auf die Platte */
    console.log('Lauf ' + def.name + ' fertig nach ' + l.laufzeitSekunden + ' s');
  });
  KS.abschluss(E);
  wiederholung(SP, E.laeufe);
  E.reihenenden = reihenenden(V);
  E.verschiebung = verschiebung(E, liesJson(path.join(NR85, 'ergebnis.json')));
  var mitGleich = KS.LAEUFE.every(function (def) { return E.reihenenden[def.name].buchEnde === E.laeufe[def.name].mit.k0.buchEnde; });
  E.vollstaendig = SP.bestanden && mitGleich;
  E.laufzeitSekunden = Math.round((Date.now() - t0) / 100) / 10;
  fs.writeFileSync(datei, JSON.stringify(E, null, 1));
  if (!E.vollstaendig) throw new Error('WIEDERHOLBARKEIT nicht bestanden - ergebnis.json bleibt vollstaendig: false, kein ERGEBNIS.md');
  fs.writeFileSync(path.join(__dirname, 'ERGEBNIS.md'), ergebnisText(E));
  KS.LAEUFE.forEach(function (def) {
    var v = E.verschiebung.laeufe[def.name].mit;
    console.log(def.name + ' mit K: Endwert ' + v.buchEnde.alt.toFixed(2) + ' -> ' + v.buchEnde.neu.toFixed(2) + ', Abstand ' + v.abstandPa.alt.toFixed(2) + ' -> ' + v.abstandPa.neu.toFixed(2) +
      ', vorn ' + v.vorDemMarkt.alt + ' -> ' + v.vorDemMarkt.neu + ', Median ' + v.median.alt.toFixed(2) + ' -> ' + v.median.neu.toFixed(2));
  });
  console.log('Laufzeit s', E.laufzeitSekunden);
}

module.exports = { KENNUNG: KENNUNG, selbstpruefung: selbstpruefung, wiederholung: wiederholung, verschiebung: verschiebung, ergebnisText: ergebnisText };

if (require.main === module) lauf();
