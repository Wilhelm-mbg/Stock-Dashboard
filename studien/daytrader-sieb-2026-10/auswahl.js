'use strict';
/* AUSWAHL des Daytrader-Siebs (Nr. 107, REGEL.md §1 und §2) - Werte und Tage, VOR dem ersten Siegel.
 *
 * Liest nur: Stammdaten (SEC-SIC, Sektor), Yahoo-Tagesbalken bis 2022-12-30 (Umsatz am Stichtag),
 * und aus dem 1m-Archiv nur ZAHLEN (Kerzen je Tag, Vorhandensein) - kein Kurs aus 2023-2026 wird
 * ausgegeben oder gespeichert. Schreibt werte.json und tage.json.
 *
 *   node studien/daytrader-sieb-2026-10/auswahl.js
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var L = require('../vorregistrierung-2026-09-06-signale-minuten/lesen.js');
var K = require('../vorregistrierung-2026-09-06-signale-minuten/konfig.js');
var WA = require(path.join(K.REPO, 'studien', 'messmaschine', 'strategien', 'wertpapierart.js'));
var G = require('./gemeinsam.js');

var HIER = __dirname;
var STAMM = path.join(require('os').homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'markt', 'stammdaten.json');
var TAG1D = path.join(K.archivWurzel(), 'archiv1d');

/* ---------- Tage (REGEL §2) ---------- */
function tageZiehen() {
  var kal = K.kalender();
  function voll(t) { var e = kal.close[t] || {}; return (e.open || '09:30') === '09:30' && (e.close || '16:00') === '16:00'; }
  function zieh(von, bis, seed) {
    var pool = kal.tage.filter(function (t) { return t >= von && t <= bis && voll(t) && kal.idx[t] >= 21; });
    return G.ziehe(pool, G.N_TAGE, seed).sort();
  }
  return {
    suche: zieh(G.SUCHE.von, G.SUCHE.bis, G.SEED_SUCHE),
    bestaetigung: zieh(G.BESTAETIGUNG.von, G.BESTAETIGUNG.bis, G.SEED_BESTAETIGUNG),
  };
}

/* ---------- Umsatz am Stichtag (REGEL §1) ---------- */
function umsatzStichtag(sym) {
  var p = path.join(TAG1D, 'bars_1d_' + sym + '.json');
  if (!fs.existsSync(p)) return null;
  var s = JSON.parse(fs.readFileSync(p, 'utf8')).series || [];
  var vor = s.filter(function (b) { var d = new Date(b[0]).toISOString().slice(0, 10); return d <= G.STICHTAG && d >= '2022-10-01' && b[1] > 0 && b[2] >= 0; });
  if (vor.length < 20) return null;
  var letzte = vor.slice(-20);
  if (new Date(letzte[19][0]).toISOString().slice(0, 10) < '2022-12-23') return null;   // Reihe am Stichtag nicht mehr frisch
  return G.median(letzte.map(function (b) { return b[1] * b[2]; }));
}

/* ---------- Vorhandensein (REGEL §1: nur Zahl der Kerzen, keine Kurse) ---------- */
function pruefeVorhanden(R, tage) {
  var kal = K.kalender(), jahre = {}, grund = null;
  function jahr(y) {
    if (jahre[y] !== undefined) return jahre[y];
    var j = L.ladeJahr(R, y);
    if (!j.ok) return (jahre[y] = null);
    var zahl = {};
    j.kerzen.forEach(function (k) { var t = L.tagVon(k[0]); zahl[t] = (zahl[t] || 0) + 1; });
    var aus = L.ausschlussTage(R, L.massnahmenFuer(R), j.quelle, j.angewandt);
    j = null;                                                                         // Kurse sofort verwerfen
    return (jahre[y] = { zahl: zahl, aus: aus });
  }
  function anzahl(t) { var y = jahr(+t.slice(0, 4)); return y ? (y.zahl[t] || 0) : 0; }
  for (var q = 0; q < tage.length && !grund; q++) {
    var t = tage[q], i = kal.idx[t], e = kal.close[t] || {};
    var soll = G.sollMinuten(e);
    var y = jahr(+t.slice(0, 4));
    if (!y) { grund = t + ': Jahresdatei fehlt'; break; }
    if (y.aus.has(t)) { grund = t + ': Kapitalmassnahme +-' + K.MASSNAHMEN_FENSTER_TAGE + ' Tage'; break; }
    if (anzahl(t) < K.DICHTE_MIN * soll) { grund = t + ': ' + anzahl(t) + ' von ' + soll + ' Kerzen'; break; }
    if (anzahl(kal.tage[i - 1]) < 1) { grund = t + ': Vortag ohne Kerzen'; break; }
    var da = 0; for (var d = i - G.KLASSE_FENSTER; d < i; d++) if (anzahl(kal.tage[d]) > 0) da++;
    if (da < G.KLASSE_MIN_TAGE) { grund = t + ': nur ' + da + ' Vortage fuer die Klasse'; break; }
  }
  return grund;
}

function main() {
  var tage = tageZiehen();
  var alle = tage.suche.concat(tage.bestaetigung);
  var stamm = JSON.parse(fs.readFileSync(STAMM, 'utf8')).werte;
  var reihen = {}; L.reihen().forEach(function (R) { reihen[R.reihe] = R; });

  /* Kandidaten: Aktie, eigene 1m-Reihe ohne Kuerzelwechsel, Sektor bekannt, Umsatz >= 250 Mio $ */
  var kand = [], gezaehlt = { stamm: 0, keinSektor: 0, keineAktie: 0, keineReihe: 0, keinTagesbalken: 0, unter250: 0 };
  Object.keys(stamm).forEach(function (sym) {
    gezaehlt.stamm++;
    var w = stamm[sym], sektor = G.sektor(w);
    if (!sektor) { gezaehlt.keinSektor++; return; }
    var r = sym.replace(/-/g, '.');
    if (!WA.istAktie(r) && !WA.istAktie(sym)) { gezaehlt.keineAktie++; return; }
    var R = reihen[r] || reihen[sym];
    if (!R || R.schnittMs != null || R.abMs != null) { gezaehlt.keineReihe++; return; }
    var u = umsatzStichtag(R.reihe); if (u == null && R.reihe !== sym) u = umsatzStichtag(sym);
    if (u == null) { gezaehlt.keinTagesbalken++; return; }
    if (!(u >= G.UMSATZ_MIN)) { gezaehlt.unter250++; return; }
    kand.push({ sym: R.reihe, cik: w.cik, sektor: sektor, sic: w.sic, umsatzMio: Math.round(u / 1e5) / 10 });
  });
  /* je Unternehmen (CIK) nur die umsatzstaerkste Reihe */
  var jeCik = {};
  kand.forEach(function (c) { if (!jeCik[c.cik] || c.umsatzMio > jeCik[c.cik].umsatzMio) jeCik[c.cik] = c; });
  kand = Object.keys(jeCik).map(function (k) { return jeCik[k]; });
  var jeSektor = {};
  kand.forEach(function (c) { (jeSektor[c.sektor] = jeSektor[c.sektor] || []).push(c); });
  Object.keys(jeSektor).forEach(function (s) { jeSektor[s].sort(function (a, b) { return b.umsatzMio - a.umsatzMio || (a.sym < b.sym ? -1 : 1); }); });

  /* Rundlauf (REGEL §1): Runde r nimmt je Sektor den naechsten tauglichen Wert; Sektoren der Runde
   * nach dem Umsatz ihres naechsten Kandidaten absteigend; bis 50 voll. Untaugliche (Vorhandensein)
   * werden uebersprungen = der naechste desselben Sektors rueckt nach. */
  var zeiger = {}, gewaehlt = [], ersetzt = [];
  Object.keys(jeSektor).forEach(function (s) { zeiger[s] = 0; });
  var spy = { reihe: 'SPY', ordner: L.ordnerFuer('SPY'), schnittMs: null, abMs: null };
  var spyGrund = pruefeVorhanden(spy, alle);
  for (var runde = 1; gewaehlt.length < G.N_WERTE && runde < 50; runde++) {
    var diese = [];
    Object.keys(jeSektor).forEach(function (s) {
      while (zeiger[s] < jeSektor[s].length) {
        var c = jeSektor[s][zeiger[s]++];
        var grund = pruefeVorhanden(reihen[c.sym], alle);
        if (!grund) { diese.push(c); return; }
        ersetzt.push({ sym: c.sym, sektor: s, grund: grund });
        process.stderr.write('ersetzt ' + c.sym + ' (' + s + '): ' + grund + '\n');
      }
    });
    diese.sort(function (a, b) { return b.umsatzMio - a.umsatzMio; });
    diese.forEach(function (c) { if (gewaehlt.length < G.N_WERTE) { c.runde = runde; gewaehlt.push(c); } });
    if (!diese.length) break;
  }
  var proSektor = {};
  gewaehlt.forEach(function (c) { proSektor[c.sektor] = (proSektor[c.sektor] || 0) + 1; });
  var kandJeSektor = {}; Object.keys(jeSektor).forEach(function (s) { kandJeSektor[s] = jeSektor[s].length; });
  fs.writeFileSync(path.join(HIER, 'tage.json'), JSON.stringify(tage, null, 1));
  fs.writeFileSync(path.join(HIER, 'werte.json'), JSON.stringify({
    regel: 'REGEL.md §1', stichtag: G.STICHTAG, quelleUmsatz: 'Yahoo-Tagesbalken archiv1d, Median Schluss x Stueck der letzten 20 Balken bis Stichtag',
    quelleSektor: 'SEC-SIC aus markt/stammdaten.json, Faltung stammdaten.js, Abweichung SIC 6798 -> Immobilien',
    gezaehlt: gezaehlt, kandidatenJeSektor: kandJeSektor, proSektor: proSektor, spy: spyGrund || 'vorhanden',
    werte: gewaehlt, ersetzt: ersetzt,
  }, null, 1));
  console.log('Werte', gewaehlt.length, JSON.stringify(proSektor));
  console.log('ersetzt', ersetzt.length, 'SPY', spyGrund || 'vorhanden', 'gezaehlt', JSON.stringify(gezaehlt));
}
if (require.main === module) main();
module.exports = { tageZiehen: tageZiehen };
