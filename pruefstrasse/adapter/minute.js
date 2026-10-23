'use strict';
/* ADAPTER minute (FORM.md §3): ein Modul in der Form von strategien/rsi2seit.js durch die Messmaschine (studien/messmaschine/
 * messmaschine.js messe), Kassa-Huerde je Klasse wie dort (kosten.spanneBp). Das 60m-Archiv kommt aus konfig.json (archiv60m) und
 * wird vorher gezaehlt; die Wertpapier-Klassifizierung geht per PRUEFSTRASSE_WERTPAPIERARTEN an wertpapierart.js (additiv).
 * Holdout: das 60m-Archiv beginnt erst 2023-09, deshalb hat diese Form ihr eigenes Sperrdatum (konfig minute.sperreAb) -
 * ohne Siegel 2 liest die Maschine nur Kerzen davor (optionen.bisMs, additive Option der Maschine), mit Siegel die Pruefzeit ab dort.
 * Innerhalb jeder Haelfte macht die Maschine ihren eigenen Schnitt (B5, Entdeckung/Bestaetigung); das Kandidaten-Kriterium
 * nimmt ihre Bestaetigungs-Zahlen (netto je Signal, t, delta80). NUR LESEN. Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var K = require('../konfig.js');
var SG = require('../siegel.js');

K.ordnerPruefen(K.ARCHIV60M.ordner, K.ARCHIV60M.mindestDateien, '60m-Archiv');
if (K.WERTPAPIERARTEN) { K.dateiPruefen(K.WERTPAPIERARTEN, 'Wertpapier-Klassifizierung'); process.env.PRUEFSTRASSE_WERTPAPIERARTEN = K.WERTPAPIERARTEN; }
if (!process.env.STOCK_DASHBOARD_QUELLE) process.env.STOCK_DASHBOARD_QUELLE = K.REPO;
var M = require(path.join(K.REPO, 'studien', 'messmaschine', 'messmaschine.js'));

function ms(datum, ende) { var p = datum.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2], ende ? 23 : 0, ende ? 59 : 0, ende ? 59 : 0); }
function vortag(datum) { return new Date(ms(datum) - 86400000).toISOString().slice(0, 10); }

/** Ein Lauf der Maschine im Fenster [von, bis] (Kalendertage). */
function messe(regel, von, bis) {
  var r = M.messe(regel, K.ARCHIV60M.ordner, { vonMs: von ? ms(von) : null, bisMs: bis ? ms(bis, true) : null });
  if (r.verweigert) throw new Error('MESSMASCHINE VERWEIGERT: ' + r.grund);
  return r;
}
/** Die Zahlen einer Variante in Pp: brutto je Signal (Bestaetigung), Huerde je Umlauf, netto, t, delta80, Urteil der Maschine. */
function zahlen(r, vi) {
  var e = r.ergebnisse[vi], b = e.bestaetigung, u = r.entscheidungen.filter(function (x) { return x.regel === 'Urteil Variante ' + vi; })[0];
  var d80 = u && u.ergebnis && u.ergebnis.delta80 != null ? u.ergebnis.delta80 * 100 : null;
  return { signale: e.signale, bruttoJeSignalPp: b.ueberschuss.jeSignal != null ? b.ueberschuss.jeSignal * 100 : null, huerdePp: e.kosten.jeUmlaufAnteil * 100,
    nettoJeSignalPp: e.nettoJeSignalBestaetigung != null ? e.nettoJeSignalBestaetigung * 100 : null, tagesmittelPp: b.ueberschuss.tagesmittel != null ? b.ueberschuss.tagesmittel * 100 : null,
    t: b.ueberschuss.t, mdePp: b.ueberschuss.mde != null ? b.ueberschuss.mde * 100 : null, delta80Pp: d80, urteilMaschine: u && u.ergebnis ? u.ergebnis.urteil : null,
    entdeckungJeSignalPp: e.entdeckung.ueberschuss.jeSignal != null ? e.entdeckung.ueberschuss.jeSignal * 100 : null,
    universum: r.universum, placebo: r.placebo ? { tagesmittelPp: r.placebo.tagesmittel != null ? r.placebo.tagesmittel * 100 : null, t: r.placebo.t } : null,
    warnungen: (r.warnungen || []).map(function (w) { return w.kennung; }) };
}

/**
 * Ein ganzer Lauf. regel = Strategiemodul, kand = kandidat.json (konfigurationen = Parametervarianten, params je Zeile oder regel.params),
 * opt = { pruefzeit, siegelPfad, repo }. Ohne Siegel nur bis zum Vortag von K.MINUTE.sperreAb.
 */
function lauf(regel, kand, opt) {
  opt = opt || {};
  var siegel = null;
  if (opt.pruefzeit) { if (!opt.siegelPfad) throw SG.sperrFehler('Pruefzeit verlangt, aber kein Siegel genannt'); siegel = SG.pruefeSiegel(opt.repo || K.REPO, opt.siegelPfad); }
  var varianten = kand.konfigurationen.map(function (c) { return c.params || regel.params || {}; });
  var S = Object.assign({}, regel, { varianten: varianten });
  var E = messe(S, K.MINUTE.von, vortag(K.MINUTE.sperreAb));
  var aus = { quelle: '60m-archiv', archiv: K.ARCHIV60M.ordner, gesperrt: !siegel, siegel: siegel, sperreAb: K.MINUTE.sperreAb, konfigurationen: [] };
  var P = siegel ? messe(S, K.MINUTE.sperreAb, null) : null;
  kand.konfigurationen.forEach(function (c, vi) {
    var z = zahlen(E, vi), gruende = [];
    if (!(z.nettoJeSignalPp > 0)) gruende.push('netto <= 0');
    if (!(z.t >= K.KANDIDAT_T)) gruende.push('t < ' + K.KANDIDAT_T);
    if (z.urteilMaschine === 'widerlegt') gruende.push('Maschine: widerlegt');
    if (z.delta80Pp != null && z.delta80Pp > z.huerdePp) gruende.push('Tor 2: delta80 ueber der Huerde');
    var kandidat = gruende.length === 0;
    var k = { key: c.key, params: varianten[vi], entdeckung: z, kandidat: kandidat, gruende: gruende, tor1: null, mde80: z.mdePp,
      urteil: kandidat ? 'Kandidat' : (z.tagesmittelPp != null && z.mdePp != null && z.tagesmittelPp + z.mdePp < 0) ? 'nein' : 'nicht entscheidbar' };
    if (P) { var zp = zahlen(P, vi); k.pruefung = zp; k.pruefung.gleicheRichtung = Math.sign(zp.nettoJeSignalPp) === Math.sign(z.nettoJeSignalPp); k.pruefung.pEinseitig = zp.t != null ? 1 - require('./tag.js').phi(zp.t) : null; }
    aus.konfigurationen.push(k);
  });
  return aus;
}

/** Kalibrierung (Auftrag §3): rsi2seit im Fenster des Protokolls rsi2seit-2026-08-26.json (26.09.2023 bis 24.08.2026 = K.MINUTE.eichungBis, Nr. 121-2a). */
function kalibrierung() {
  var regel = require(path.join(K.REPO, 'studien', 'messmaschine', 'strategien', 'rsi2seit.js'));
  var r = messe(regel, K.MINUTE.von, K.MINUTE.eichungBis);
  return { zahlen: zahlen(r, 0), schnittTag: r.universum.schnittTag, soll: { datei: 'rsi2seit-2026-08-26.json', bruttoJeSignalPp: 0.02054524106238242, huerdePp: 0.1, nettoJeSignalPp: -0.07945475893761758, werte: 2874, handelstage: 730, schnittTag: '2025-03-12' } };
}

module.exports = { lauf: lauf, messe: messe, zahlen: zahlen, kalibrierung: kalibrierung, M: M };

if (require.main === module && process.argv.indexOf('--kalibrierung') !== -1) {
  var t0 = Date.now(), E = kalibrierung();
  var out = process.argv[process.argv.indexOf('--kalibrierung') + 1];
  if (out && out[0] !== '-') fs.writeFileSync(out, JSON.stringify(E, null, 1));
  console.log(JSON.stringify({ ist: { brutto: E.zahlen.bruttoJeSignalPp, huerde: E.zahlen.huerdePp, netto: E.zahlen.nettoJeSignalPp, werte: E.zahlen.universum.werte, handelstage: E.zahlen.universum.handelstage, schnitt: E.schnittTag, signale: E.zahlen.signale, t: E.zahlen.t }, soll: E.soll }) + ' ms ' + (Date.now() - t0));
}
