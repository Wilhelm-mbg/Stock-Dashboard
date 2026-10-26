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
var crypto = require('crypto');
var K = require('../konfig.js');
var SG = require('../siegel.js');

K.ordnerPruefen(K.ARCHIV60M.ordner, K.ARCHIV60M.mindestDateien, '60m-Archiv');
if (K.WERTPAPIERARTEN) { K.dateiPruefen(K.WERTPAPIERARTEN, 'Wertpapier-Klassifizierung'); process.env.PRUEFSTRASSE_WERTPAPIERARTEN = K.WERTPAPIERARTEN; }
if (!process.env.STOCK_DASHBOARD_QUELLE) process.env.STOCK_DASHBOARD_QUELLE = K.REPO;
var M = require(path.join(K.REPO, 'studien', 'messmaschine', 'messmaschine.js'));

function ms(datum, ende) { var p = datum.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2], ende ? 23 : 0, ende ? 59 : 0, ende ? 59 : 0); }
function vortag(datum) { return new Date(ms(datum) - 86400000).toISOString().slice(0, 10); }

/** Ein Lauf der Maschine im Fenster [von, bis] (Kalendertage) auf dem Ordner ordner (Nr. 128: lebendes archiv60m oder eingefrorene Eichdaten). */
function messeIn(ordner) {
  return function (regel, von, bis) {
    var r = M.messe(regel, ordner, { vonMs: von ? ms(von) : null, bisMs: bis ? ms(bis, true) : null });
    if (r.verweigert) throw new Error('MESSMASCHINE VERWEIGERT: ' + r.grund);
    return r;
  };
}
/** Ein Lauf der Maschine auf dem lebenden 60m-Archiv (Kandidatenlaeufe). */
function messe(regel, von, bis) { return messeIn(K.ARCHIV60M.ordner)(regel, von, bis); }
function sha256(b) { return crypto.createHash('sha256').update(b).digest('hex'); }
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

/* ---------- Eingefrorene Eichdaten (Nr. 128, Fehlerform "Eichung gegen ein lebendes Archiv driftet") ----------
 * Die Kalibrierung rechnete bis 26.10.2026 gegen das LEBENDE archiv60m (die App schreibt jede Datei bei jedem Sammelzyklus neu, Yahoo revidiert
 * Kerzen innerhalb des Fensters) - der Stichtag minute.eichungBis schnitt nur hinten ab. Seit Nr. 128 liest sie NUR minute.eichungOrdner: die
 * 60m-Reihen auf [minute.von, minute.eichungBis] geschnitten + wertpapierarten.json, je Datei Bytes und SHA-256 im _manifest.json. */
function manifestLesen(ordner) {
  if (!ordner) throw new Error('MESSGERAET: konfig.json minute.eichungOrdner fehlt - die Minute-Eichung rechnet nur auf eingefrorenen Daten (Nr. 128)');
  var mp = path.join(ordner, '_manifest.json');
  if (!fs.existsSync(mp)) throw new Error('MESSGERAET: Eichdaten fehlen - ' + mp + ' gibt es nicht (Server: Ordner in den Spiegel, Nr. 128)');
  var roh = fs.readFileSync(mp), man = JSON.parse(roh.toString('utf8'));
  if (!man.fenster || man.fenster.von !== K.MINUTE.von || man.fenster.bis !== K.MINUTE.eichungBis) {
    throw new Error('MESSGERAET: Eichdaten fuer das Fenster ' + JSON.stringify(man.fenster) + ', konfig.json minute verlangt ' + K.MINUTE.von + ' .. ' + K.MINUTE.eichungBis);
  }
  return { manifest: man, manifestSha256: sha256(roh) };
}
/** Prueft die Eichdaten gegen ihr Manifest: jede Datei da, Bytes und SHA-256 gleich, keine fremde Datei im Ordner. Jede Abweichung wirft
 *  MESSGERAET: (Daten veraendert = Eichung ungueltig). Liefert { ordner, manifestSha256, dateien, bytes, ms }. */
function eichdatenPruefen(ordner) {
  var t0 = Date.now(), L = manifestLesen(ordner), soll = {};
  L.manifest.dateien.forEach(function (e) { soll[e.datei] = e; });
  var fremd = fs.readdirSync(ordner).filter(function (f) { return f !== '_manifest.json' && !soll[f]; });
  if (fremd.length) throw new Error('MESSGERAET: Eichdaten veraendert - ' + fremd.length + ' Datei(en) nicht im Manifest (' + fremd.slice(0, 3).join(', ') + ') - Eichung ungueltig');
  var bytes = 0;
  L.manifest.dateien.forEach(function (e) {
    var p = path.join(ordner, e.datei);
    if (!fs.existsSync(p)) throw new Error('MESSGERAET: Eichdaten veraendert - ' + e.datei + ' fehlt - Eichung ungueltig');
    var b = fs.readFileSync(p), h = sha256(b);
    if (b.length !== e.bytes || h !== e.sha256) {
      throw new Error('MESSGERAET: Eichdaten veraendert - Pruefsumme ' + e.datei + ' (soll ' + e.bytes + ' B ' + e.sha256.slice(0, 12) + ', ist ' + b.length + ' B ' + h.slice(0, 12) + ') - Eichung ungueltig');
    }
    bytes += b.length;
  });
  return { ordner: ordner, manifestSha256: L.manifestSha256, dateien: L.manifest.dateien.length, bytes: bytes, ms: Date.now() - t0 };
}
/** Archiv lebt (nachrichtlich): lebende 60m-Reihen im Eichfenster gegen das Manifest - je Reihe SHA-256 der Fensterkerzen (shaKerzen). */
function archivBewegung(ordner) {
  var man = manifestLesen(ordner).manifest, soll = {}, vonMs = ms(K.MINUTE.von), bisMs = ms(K.MINUTE.eichungBis, true);
  man.dateien.forEach(function (e) { if (e.shaKerzen) soll[e.datei] = e; });
  var aus = { gleich: 0, geaendert: [], neu: [], fehlt: [] }, gesehen = {};
  fs.readdirSync(K.ARCHIV60M.ordner).filter(function (f) { return f.indexOf('bars_60m_') === 0 && f.indexOf('-USD') === -1; }).forEach(function (f) {
    var w = [];
    try { var j = JSON.parse(fs.readFileSync(path.join(K.ARCHIV60M.ordner, f), 'utf8')); w = (j.series || []).filter(function (b) { return b && b[0] >= vonMs && b[0] <= bisMs; }); } catch (e) { w = []; }
    if (!w.length) return;
    gesehen[f] = 1;
    var e = soll[f], sym = f.slice(9, -5);
    if (!e) aus.neu.push(sym + ' (' + w.length + ' Kerzen)');
    else if (sha256(JSON.stringify(w)) === e.shaKerzen) aus.gleich++;
    else aus.geaendert.push(sym + ' (' + e.kerzenFenster + ' -> ' + w.length + ' Kerzen)');
  });
  Object.keys(soll).forEach(function (f) { if (!gesehen[f]) aus.fehlt.push(f.slice(9, -5)); });
  return aus;
}

/* Soll der Minute-Kalibrierung (Nr. 128): rsi2seit auf den eingefrorenen Eichdaten, gerechnet 26.10.2026 - Geraet gegen Geraet; alt = Protokoll vom 26.08. */
var SOLL = { quelle: 'eichdaten-minute-2026-10-26 (Nr. 128, _manifest.json SHA-256 48e36fd6af83...)', bruttoJeSignalPp: 0.025834718140097065, huerdePp: 0.1, nettoJeSignalPp: -0.07416528185990294,
  werte: 2893, handelstage: 730, schnittTag: '2025-03-12', signale: 105593, t: 0.9267455380329412, toleranz: 1e-6,
  alt: { datei: 'rsi2seit-2026-08-26.json', bruttoJeSignalPp: 0.02054524106238242, nettoJeSignalPp: -0.07945475893761758, werte: 2874, grund: 'Archiv lebte 2026-09 -> 2026-10; seit 26.10. eingefroren' } };

/** Kalibrierung (Auftrag §3): rsi2seit im Fenster des Protokolls rsi2seit-2026-08-26.json (26.09.2023 bis 24.08.2026 = K.MINUTE.eichungBis, Nr. 121-2a),
 *  seit Nr. 128 auf den eingefrorenen Eichdaten (Pruefsummen vorher, sonst MESSGERAET:). lebend = true: dieselbe Rechnung auf dem lebenden archiv60m
 *  plus Reihenvergleich gegen das Manifest - nur fuer die Zeile "Archiv lebt" (nachrichtlich, nie Teil der Eichung). */
function kalibrierung(lebend) {
  var regel = require(path.join(K.REPO, 'studien', 'messmaschine', 'strategien', 'rsi2seit.js'));
  var eich = lebend ? { ordner: K.MINUTE.eichungOrdner, manifestSha256: manifestLesen(K.MINUTE.eichungOrdner).manifestSha256 } : eichdatenPruefen(K.MINUTE.eichungOrdner);
  if (!lebend) process.env.PRUEFSTRASSE_WERTPAPIERARTEN = path.join(eich.ordner, 'wertpapierarten.json');
  var messe = messeIn(lebend ? K.ARCHIV60M.ordner : eich.ordner);   // Ordner gewaehlt; der Aufruf darunter ist der des Stichtags (Nr. 121-2a)
  var r = messe(regel, K.MINUTE.von, K.MINUTE.eichungBis);
  var aus = { daten: lebend ? 'lebend' : 'eingefroren', ordner: lebend ? K.ARCHIV60M.ordner : eich.ordner, eichdaten: eich, zahlen: zahlen(r, 0), schnittTag: r.universum.schnittTag, soll: SOLL };
  if (lebend) aus.bewegung = archivBewegung(K.MINUTE.eichungOrdner);
  return aus;
}

module.exports = { lauf: lauf, messe: messe, messeIn: messeIn, zahlen: zahlen, kalibrierung: kalibrierung, eichdatenPruefen: eichdatenPruefen, archivBewegung: archivBewegung, SOLL: SOLL, M: M };

/* --eichdaten-pruefen [ordner]: nur die Pruefsummen (Vorgabe minute.eichungOrdner; Server nach dem Spiegeln); Abweichung -> Ausnahme MESSGERAET:, Exit 1 */
if (require.main === module && process.argv.indexOf('--eichdaten-pruefen') !== -1) {
  var eo = process.argv[process.argv.indexOf('--eichdaten-pruefen') + 1];
  console.log(JSON.stringify(eichdatenPruefen(eo && eo[0] !== '-' ? eo : K.MINUTE.eichungOrdner)));
}
if (require.main === module && (process.argv.indexOf('--kalibrierung') !== -1 || process.argv.indexOf('--kalibrierung-lebend') !== -1)) {
  var LEBEND = process.argv.indexOf('--kalibrierung-lebend') !== -1, t0 = Date.now(), E = kalibrierung(LEBEND);
  var out = process.argv[process.argv.indexOf(LEBEND ? '--kalibrierung-lebend' : '--kalibrierung') + 1];
  if (out && out[0] !== '-') fs.writeFileSync(out, JSON.stringify(E, null, 1));
  console.log(JSON.stringify({ daten: E.daten, ist: { brutto: E.zahlen.bruttoJeSignalPp, huerde: E.zahlen.huerdePp, netto: E.zahlen.nettoJeSignalPp, werte: E.zahlen.universum.werte, handelstage: E.zahlen.universum.handelstage, schnitt: E.schnittTag, signale: E.zahlen.signale, t: E.zahlen.t },
    eichdaten: E.eichdaten, bewegung: E.bewegung ? { gleich: E.bewegung.gleich, geaendert: E.bewegung.geaendert.length, neu: E.bewegung.neu.length, fehlt: E.bewegung.fehlt.length } : undefined, soll: E.soll }) + ' ms ' + (Date.now() - t0));
}
