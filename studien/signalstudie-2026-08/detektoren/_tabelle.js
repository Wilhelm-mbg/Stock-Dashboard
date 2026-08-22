'use strict';
/* AUFRUFTABELLE fuer das Messgeschirr der Signalstudie 2026-08 (REGISTRIERUNG.md).
 *
 * module.exports = [ { key, zeitrahmen, params, signal(bars, i, params) -> {dir:+1|-1}|null,
 *                      freigabe, anmerkung, reparatur?, liveReferenz? } ]
 *
 * Aufgenommen sind nur Detektoren mit Freigabe 'frei' oder 'nach reparatur' (Reparatur hier
 * eingebaut). Alle Funktionen sehen nur bars[0..i]; sie halten keinen Signalzustand. Die
 * einzigen Caches sind reine Datencaches (Kerzenlaenge je Reihe, Universum fuer die beiden
 * Querschnitts-Detektoren), die das Ergebnis nicht von der Aufrufreihenfolge abhaengig machen.
 *
 * Erwartete Eingabe (wie messgeschirr.js ladeUniversum): Sitzungskerzen Mo-Fr 0-390 Min,
 * Kurs > 0, Zeitstempel auf dem Minutenraster (t % 60000 === 0), Format [t, close, vol, hoch, tief].
 * Pullback filtert sein Fenster zusaetzlich auf das Intervallraster (Reparatur 5m).
 *
 * Die Querschnitts-Detektoren momentum und drift brauchen das Symbol: params.sym, bars.sym
 * oder - falls das Geschirr nichts davon setzt - ein Fingerabdruck (t|close der Kerze i und
 * i-1) gegen das 60m-Archiv. Beide laden ihr Universum beim ersten Aufruf aus dem Store.
 */
var fs = require('fs');
var path = require('path');
var Q = require('../../../quant.js');
var HIER = __dirname;
var STORE = (process.env.APPDATA || require('os').homedir() + '/AppData/Roaming') + '/markt-dashboard/store/';

/* ---------- Helfer ---------- */
var BARMIN = new WeakMap();   // Datencache: Kerzenlaenge (Minuten) je Reihe, aus dem kleinsten Abstand der ersten 60 Kerzen
function barMinVon(bars) {
  var v = BARMIN.get(bars);
  if (v) return v;
  var min = Infinity;
  for (var k = 1; k < Math.min(bars.length, 60); k++) { var d = bars[k][0] - bars[k - 1][0]; if (d > 0 && d < min) min = d; }
  v = isFinite(min) ? Math.max(1, Math.round(min / 60000)) : 60;
  BARMIN.set(bars, v);
  return v;
}
function tagVon(t) { return new Date(t).toISOString().slice(0, 10); }
function tagStart(bars, i) { var j = i; var tg = tagVon(bars[i][0]); while (j > 0 && tagVon(bars[j - 1][0]) === tg) j--; return j; }
function dirVon(s) { return s === 'call' || s === 'up' ? { dir: 1 } : (s === 'put' || s === 'down' ? { dir: -1 } : null); }

/* ---------- 1. rsi2 (Connors RSI(2)-Extrem, EMA100-Trendfilter) - frei ---------- */
function rsi2(bars, i, p) {
  p = p || {};
  var win = bars.slice(Math.max(0, i - (p.window || 260)), i + 1);          // 261 Kerzen wie einstiegSignal (quant.js:1601)
  var s = Q.rsiExtremSignal(win, p.kaufSchwelle || 10, p.verkaufSchwelle || 90);
  if (!s.signal) return null;
  // Live (depot.js:2775) und Messlauf (quant.js:1743) gaten 1m mit der 5-Min-Bestaetigung
  if (p.mtf === true || (p.mtf === 'auto' && barMinVon(bars) === 1)) { if (!Q.mtfAgrees(win, s.signal, 5)) return null; }
  return dirVon(s.signal);
}

/* ---------- 2. rsi2seit (RSI2 im Seitwaertskanal) - nach Reparatur (Fenster-Guard) ---------- */
var P_RSI2SEIT = { ENTRY: 'rsi2seit', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2.0, MINQ: 0, CHAN: false, MTF: false, TREND: false };
function rsi2seit(bars, i, p) {
  if (i < 260 || i >= bars.length) return null;                               // volles Fenster 261 / Kanal 201 = gemessene Variante
  var s = Q.einstiegSignal(bars, i, Object.assign({}, P_RSI2SEIT, p || {}));
  return s && s.dir ? dirVon(s.dir) : null;
}

/* ---------- 3. kapitulation (Kapitulations-Dip im Abwaertskanal, nur Long) - frei ---------- */
var P_KAPI = { ENTRY: 'kapitulation', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2.0, MINQ: 0, CHAN: false, MTF: false, TREND: false };
function kapitulation(bars, i, p) {
  if (i < 260 || i >= bars.length) return null;
  var s = Q.einstiegSignal(bars, i, Object.assign({}, P_KAPI, p || {}));
  return s && s.dir === 'call' ? { dir: 1 } : null;
}

/* ---------- 4. reversion (Ueberdehnung, z-Score zur EMA20) - nach Reparatur (1m Tagesreihe) ---------- */
function reversion(bars, i, p) {
  p = Object.assign({ lineType: 'ema', period: 20, zThr: 2.0, tagesreihe: 'auto' }, p || {});
  var tages = p.tagesreihe === true || (p.tagesreihe === 'auto' && barMinVon(bars) === 1);   // Live 1m = Yahoo range 1d (depot.js:1995)
  var j0 = tages ? tagStart(bars, i) : Math.max(0, i - Math.max(p.period * 4, 260));
  var win = bars.slice(j0, i + 1);
  if (tages && win.length <= 30) return null;                                 // Fetch liefert erst ab 31 Kerzen (depot.js:2335)
  var r = Q.reversionSignal(win, p.lineType, p.period, p.zThr);
  return dirVon(r.signal);
}

/* ---------- 5. pullback (Trend-Ruecksetzer) - nach Reparatur (Intervallraster im Fenster) ---------- */
function pullback(bars, i, p) {
  p = p || {};
  var period = p.period || 20, conf = p.confirmBps === undefined ? 15 : p.confirmBps;
  var ms = barMinVon(bars) * 60000;
  if (bars[i][0] % ms !== 0) return null;                                     // Stempel-Kerze als Signalkerze: nie
  var win = bars.slice(Math.max(0, i - Math.max(period * 4, 260)), i + 1).filter(function (b) { return b[0] % ms === 0; });
  var s = Q.pullbackSignal(win, p.lineType || 'ema', period, conf);           // quant.js:884
  return dirVon(s.signal);
}

/* ---------- 6. donchian (Kanal-Ausbruch) - frei ---------- */
function donchian(bars, i, p) {
  var N = (p && p.period) || 20, conf = p && p.confirmBps !== undefined ? p.confirmBps : 15;
  if (i < N + 9) return null;
  var s = Q.donchianSignal(bars.slice(i - N - 9, i + 1), N, conf).signal;
  return dirVon(s);
}

/* ---------- 7. squeeze (Bollinger-Squeeze-Ausbruch) - frei ---------- */
function squeeze(bars, i, p) {
  p = p || {};
  var s = Q.squeezeSignal(bars.slice(Math.max(0, i - 260), i + 1), p.period || 20, p.kSigma || 2);
  return dirVon(s.signal);
}

/* ---------- 8. kanaltrend (Kreuzung in Kanalrichtung) - frei ---------- */
var P_KANALTREND = { ENTRY: 'kanaltrend', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 1.5, MINQ: 60, CHAN: false, MTF: false, TREND: false };
function kanaltrend(bars, i, p) {
  if (i < 1 || i >= bars.length) return null;
  var s = Q.einstiegSignal(bars, i, Object.assign({}, P_KANALTREND, p || {}, { ENTRY: 'kanaltrend' }));
  return s && s.dir ? dirVon(s.dir) : null;
}

/* ---------- 9. wave (Wellental) - nach Reparatur (ohne Kanal-Gate, mit Trendpflicht, ohne MTF) ---------- */
var P_WAVE = { ENTRY: 'wave', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2.0, MINQ: 60, CHAN: false, MTF: false, TREND: true };
function wave(bars, i, p) {
  if (i < 2 || i >= bars.length) return null;
  var v = Q.einstiegSignal(bars, i, Object.assign({}, P_WAVE, p || {}));
  return v && v.dir ? dirVon(v.dir) : null;
}

/* ---------- 10. orb (Opening-Range-Breakout) - frei ---------- */
var ORB = require(path.join(HIER, 'orb.js'));
function orb(bars, i, p) {
  var r = ORB.orbSignal(bars, i, Object.assign({ orbMin: 30, confirmBps: 15, minRangeBars: 3, nurErster: true }, p || {}));
  return r ? { dir: r.dir } : null;
}

/* ---------- 11. signalCross (MA-Kreuzung) - nach Reparatur (eine Kreuzung = ein Signal) ---------- */
function crossRoh(bars, i, P) {
  var w = bars.slice(Math.max(0, i - Math.max(P.period * 4, 260)), i + 1);
  var c = Q.signalCross(w, P.lineType, P.period, P.confirmBps, P.lookback).crossed;
  return c ? (c === 'up' ? 1 : -1) : 0;
}
function signalCross(bars, i, p) {
  var P = Object.assign({ lineType: 'ema', period: 20, confirmBps: 15, lookback: 3 }, p || {});
  var d = crossRoh(bars, i, P); if (!d) return null;
  var w = bars.slice(Math.max(0, i - Math.max(P.period * 4, 260)), i + 1), c = w.map(function (b) { return b[1]; }), e = Q.emaSeries(c, P.period);
  // seit dem letzten Schluss auf der Gegenseite der EMA schon ein Rohsignal gleicher Richtung? dann kein neues Signal
  for (var j = w.length - 2; j >= 0 && (d > 0 ? c[j] > e[j] : c[j] < e[j]); j--) if (crossRoh(bars, i - (w.length - 1 - j), P) === d) return null;
  return { dir: d };
}

/* ---------- 12. vwap-Abstand (Studien-Definition) - nach Reparatur (kein Signal am Schluss) ---------- */
function vwapAbstand(bars, i, p) {
  p = Object.assign({ period: 20, zThr: 2.0, schlussAbMin: 375 }, p || {});
  var bm = barMinVon(bars);
  if (Q.minutenSeitOeffnung(bars[i][0]) + bm >= p.schlussAbMin) return null; // Kerzenende ab Minute 375: live nie ausgewertet (nearClose, marketOpen)
  var b = bars.slice(0, i + 1);
  if (b.length < 65 || b[0].length < 3) return null;
  var s = Q.reversionSignal(b, 'vwap', p.period, p.zThr);
  return dirVon(s.signal);
}

/* ---------- 13. wendepunkt-trendwechsel (Felix' Winkel-Detektor) - nach Reparatur ---------- */
var WP = require(path.join(HIER, 'wendepunkt-trendwechsel.js'));
var WP_CACHE = new WeakMap();   // Datencache: Wendepunktlisten je Reihe (ganz) bzw. je Tages-Slice
function wendepunktTrendwechsel(bars, i, p) {
  p = Object.assign({ S: 1.0, F: 5, tagesreihe: 'auto', minTagesKerzen: 59 }, p || {});
  var tages = p.tagesreihe === true || (p.tagesreihe === 'auto' && barMinVon(bars) === 1);   // Live 1m = range 1d (depot.js:1099/1995)
  var c = WP_CACHE.get(bars); if (!c) { c = { ganz: null, tage: {} }; WP_CACHE.set(bars, c); }
  var reihe, ci, wp;
  if (tages) {
    var j0 = tagStart(bars, i);
    if (i - j0 + 1 < p.minTagesKerzen) return null;                         // depot.js:1102: unter 60 Kerzen 'keine Daten'
    var e = c.tage[j0];
    if (!e) { var ende = i; while (ende + 1 < bars.length && tagVon(bars[ende + 1][0]) === tagVon(bars[j0][0])) ende++;
      var sl = bars.slice(j0, ende + 1); e = { slice: sl, wp: WP.vorbereiten(sl, p) }; c.tage[j0] = e; }
    reihe = e.slice; ci = i - j0; wp = e.wp;                                  // Wendepunkte der ganzen Tagesreihe; urteil() nutzt nur die bis ci bestaetigten
  } else {
    if (!c.ganz) c.ganz = WP.vorbereiten(bars, p);
    reihe = bars; ci = i; wp = c.ganz;
  }
  var s = WP.signal(reihe, ci, { S: p.S, F: p.F, ersteImAbschnitt: true, _wp: wp });
  return s ? { dir: s.dir } : null;
}

/* ---------- Querschnitt: 60m-Universum (Datencache) + Symbol-Erkennung ---------- */
var UNI = null;
function universum60m() {
  if (UNI) return UNI;
  var u = {}, fp = {};
  fs.readdirSync(STORE).filter(function (f) { return /^bars_60m_[^_].*\.json$/.test(f); }).forEach(function (f) {
    var sym = f.slice(9, -5);
    if (/-USD$/.test(sym)) return;
    var s; try { s = JSON.parse(fs.readFileSync(STORE + f, 'utf8')).series || []; } catch (e) { return; }
    u[sym] = s;
    s.forEach(function (b) { var k = b[0] + '|' + b[1]; (fp[k] = fp[k] || []).push(sym); });
  });
  UNI = { bars: u, fp: fp };
  return UNI;
}
function symVon(bars, i, p) {
  if (p && p.sym) return p.sym;
  if (bars.sym) return bars.sym;
  var U = universum60m();
  var k = U.fp[bars[i][0] + '|' + bars[i][1]];
  if (!k) return null;
  if (k.length === 1) return k[0];
  if (i > 0) { var k2 = U.fp[bars[i - 1][0] + '|' + bars[i - 1][1]] || []; var g = k.filter(function (s) { return k2.indexOf(s) !== -1; }); if (g.length === 1) return g[0]; }
  return null;
}

/* ---------- 14. momentum (Querschnitts-Momentum, Momentum-Buch) - frei ---------- */
var MOM = require(path.join(HIER, 'momentum.js'));
var VB = null;
function momentum(bars, i, p) {
  p = p || {};
  var sym = symVon(bars, i, p); if (!sym) return null;
  if (!VB) VB = p.vb || MOM.vorbereiten(universum60m().bars);                 // einmal je Lauf: Tagesachse aus dem 60m-Archiv (114 Aktien)
  var s = MOM.momentumSignal(bars, i, { sym: sym, vb: VB, rueckblick: p.rueckblick || 231, luecke: p.luecke == null ? 21 : p.luecke, anteil: p.anteil || 0.10, minWerte: p.minWerte || 25 });
  return s ? { dir: s.dir } : null;
}

/* ---------- 15. drift (Ertragstermin-Drift) - nach Reparatur (istTagesreihe, Terminhygiene) ---------- */
var DRIFT = require(path.join(HIER, 'drift.js'));
var TAB = null;
function driftTabelle() {
  if (TAB) return TAB;
  var kursMap = {};
  for (var t = 0; t < 8; t++) { try { Object.assign(kursMap, JSON.parse(fs.readFileSync(STORE + 'mf_tagesdaten_teil_' + t + '.json', 'utf8')).roh); } catch (e) { } }
  var markt = JSON.parse(fs.readFileSync(STORE + 'drift_markt.json', 'utf8')).reihe;
  var archiv = JSON.parse(fs.readFileSync(STORE + 'drift_termine.json', 'utf8'));
  var stand = archiv.at || Date.now();
  var termine = {};
  Object.keys(kursMap).forEach(function (s) {
    var L = (archiv.sym[s] || []).filter(function (x) {
      var ms = Date.parse(x[0]);
      if (!(ms <= stand)) return false;                                       // Zukunftstermine mit angehaengter Vorquartals-Ueberraschung (Befund) raus
      var h = new Date(ms).getUTCHours();
      if (ms >= Date.UTC(2023, 0, 1) && (h === 4 || h === 5)) return false;   // Mitternacht-Stempel ohne Uhrzeit (Meldung unbekannt) raus
      return true;
    });
    if (L.length) termine[s] = L;
  });
  TAB = DRIFT.signalTabelle(kursMap, termine, markt);
  return TAB;
}
function drift(bars, i, p) {
  p = p || {};
  var sym = symVon(bars, i, p); if (!sym) return null;
  var tab = p.tabelle || driftTabelle();
  var sig = tab[sym]; if (!sig) return null;
  var tages = p.tages != null ? p.tages : barMinVon(bars) >= 1200;
  var s = DRIFT.signal(bars, i, { signale: sig, schlussAbMin: 900, tages: tages });
  return s ? { dir: s.dir } : null;
}

/* ---------- Tabelle ---------- */
module.exports = [
  { key: 'rsi2', zeitrahmen: ['1m', '5m', '15m', '60m'],
    params: { kaufSchwelle: 10, verkaufSchwelle: 90, window: 260, mtf: 'auto' }, signal: rsi2, freigabe: 'frei',
    anmerkung: 'Q.rsiExtremSignal auf 261 Kerzen (quant.js:801, Fenster quant.js:1601). mtf auto = nur bei 1m die 5-Min-Bestaetigung (Live depot.js:2775, Messlauf quant.js:1743). Feuert auf ~28 % der Kerzen (ungeglaetteter RSI) - Tages-Clusterung zwingend. UI-Felder Periode/Bestaetigung wirken nicht.' },

  { key: 'rsi2seit', zeitrahmen: ['60m'],
    params: {}, signal: rsi2seit, freigabe: 'nach reparatur', liveReferenz: 'long',
    reparatur: 'Fenster-Guard i >= 260 (Pruefer-Mantel feuerte ab i=189 mit verkuerztem Fenster); belegte Kante zaehlt nur dir=+1.',
    anmerkung: 'Q.einstiegSignal ENTRY rsi2seit (quant.js:1638-1666): RSI2 10/90 + Kanal 201 Kerzen seit + Volumen > 1,3x Oe50. 64 % der Signale auf der Eroeffnungskerze (Gap), 15 % auf der 19:30-Kerze (live erst am Folgetag gehandelt). Live-Fenster 1mo (~150 Kerzen) weicht von dieser 261er-Variante ab - App-Reparatur offen, Studie misst die belegte Variante.' },

  { key: 'kapitulation', zeitrahmen: ['60m'],
    params: {}, signal: kapitulation, freigabe: 'frei', liveReferenz: 'long',
    anmerkung: 'Q.einstiegSignal ENTRY kapitulation (quant.js:1671-1697): z<=-2 zur EMA20 + Kanal ab + Volumen > 1,3x; nur Long. Sehr selten (2-9 je Symbol auf 740 Tagen), clustert an Stresstagen - MDE vor dem Urteil. i >= 260.' },

  { key: 'reversion', zeitrahmen: ['1m', '5m', '15m'],
    params: { lineType: 'ema', period: 20, zThr: 2.0, tagesreihe: 'auto' }, signal: reversion, freigabe: 'nach reparatur',
    reparatur: 'Auf 1m Tagesreihe statt 261-Fenster (Live holt range=1d; 40 % der Fenster-Signale waeren live unerreichbar); ab 31 Kerzen. 5m/15m unveraendert 261-Fenster.',
    anmerkung: 'Q.reversionSignal (quant.js:929), Live-Parameter 20 / zOf(15)=2,0. Live-1m haengt zusaetzlich ein 5m-MTF-Gate an (nicht Teil der registrierten Definition). Auf 5m/15m ballen sich Signale an der Eroeffnung (Nachtluecke in EMA/Distanz) - Tageszeit-Bedingung getrennt lesen.' },

  { key: 'pullback', zeitrahmen: ['5m'],
    params: { lineType: 'ema', period: 20, confirmBps: 15 }, signal: pullback, freigabe: 'nach reparatur',
    reparatur: 'Signalkerze und Fenster auf das Intervallraster gefiltert (t % (barMin*60000) === 0): Archiv 5m enthielt am 19.08. in 45 Symbolen Stempel-Kerzen INNERHALB der Sitzung, die der Minutenraster-Filter des Geschirrs nicht faengt; ~17 % der Signale dieser Tage hingen daran.',
    anmerkung: 'Q.pullbackSignal (quant.js:884), 261-Fenster wie Backtest; App-Standard 5m/ema/20/15 (applySetup depot.js:7453). Live-Fenster (5d) vs 261: 1 Abweichung in 22.180.' },

  { key: 'donchian', zeitrahmen: ['5m'],
    params: { period: 20, confirmBps: 15 }, signal: donchian, freigabe: 'frei',
    anmerkung: 'Q.donchianSignal (quant.js:821) auf N+10 Kerzen; Live 20/15 (Backtest-Raster 10 Bp - nicht verwendet). 20 % der Signale sind Gap-Ausbrueche in der Eroeffnungskerze (m < 5) - als Zusatzspalte ausweisen. Latent: null-Hoch/Tief wuerde Puts verschlucken (im Archiv nicht vorhanden).' },

  { key: 'squeeze', zeitrahmen: ['60m', '5m', '15m'],
    params: { period: 20, kSigma: 2 }, signal: squeeze, freigabe: 'frei',
    anmerkung: 'Q.squeezeSignal (quant.js:845), 261-Fenster, >= 120 Kerzen. Kompressionsbedingung fast wirkungslos (Signal auf 9-13 % aller Kerzen, Laeufe von ~2 Kerzen) - Geschirr-Cooldown nimmt die Folgekerzen; ein Drittel der 60m-Signale in der ersten Handelsstunde. confirmBps ohne Wirkung.' },

  { key: 'kanaltrend', zeitrahmen: ['60m', '15m', '5m'],
    params: { MINQ: 60 }, signal: kanaltrend, freigabe: 'frei',
    anmerkung: 'Q.einstiegSignal ENTRY kanaltrend (quant.js:1699-1737): Kanal gueltig + score>=60 + EMA20-Kreuzung in Kanalrichtung. Live rechnet diesen Modus NICHT (handelt die reine Kreuzung) - Studie misst die quant.js-Funktion. Feuert in Laeufen von 2-3 Kerzen (Geschirr-Cooldown). 5m/15m fast signalfrei (1-5 je Symbol) - Tier A unentschieden per MDE.' },

  { key: 'wave', zeitrahmen: ['1m', '5m', '15m', '60m'],
    params: { CHAN: false, TREND: true, MTF: false }, signal: wave, freigabe: 'nach reparatur',
    reparatur: 'Gemessen OHNE Kanal-Gate (CHAN:false), MIT Live-Trendpflicht EMA100 (TREND:true), OHNE MTF auf allen Zeitrahmen. Mit der Live-Konfiguration (CHAN:true) gab es 0-2 Signale je Symbol auf 740 Tagen - nicht messbar. Abweichung vom App-Standard dokumentieren; Kanal laeuft als binaere Bedingung mit.',
    anmerkung: 'Q.einstiegSignal ENTRY wave (quant.js:1603-1616, Trend 1744-1759; waveQuality quant.js:958, MINQ 60 hart). App-Standard fuer den Ausloeser Wellental ist 1m mit 5m-MTF - MTF hier bewusst aus (Studie und Live buendeln unterschiedlich). Ueber die Haelfte der 5m-Signale sind Eroeffnungs-Gaps.' },

  { key: 'orb', zeitrahmen: ['1m', '5m'],
    params: { orbMin: 30, confirmBps: 15, minRangeBars: 3, nurErster: true }, signal: orb, freigabe: 'frei',
    anmerkung: 'Reine Nachbildung von depot.js:2629-2648 / quant.js:2549-2555 (orb.js): Range aus SCHLUSSKURSEN der ersten 30 Min des UTC-Tages, Ausbruch um 15 Bp, erster Ausbruch je Richtung und Tag (ersetzt D.orb.traded). Feuert fast taeglich, oft beide Richtungen - effektive Stichprobe = Tage. 1m-Live traegt zusaetzlich MTF (nicht registriert). 15m/60m per Konstruktion 0 Signale.' },

  { key: 'signalCross', zeitrahmen: ['5m', '15m', '60m'],
    params: { lineType: 'ema', period: 20, confirmBps: 15, lookback: 3 }, signal: signalCross, freigabe: 'nach reparatur',
    reparatur: 'Eine Kreuzung = ein Signal: Rohsignal nur, wenn seit dem letzten Schluss auf der Gegenseite der EMA noch kein Rohsignal gleicher Richtung fiel (rohes Q.signalCross steht als 6-Kerzen-Zustand auf 34 % der Kerzen; Pruefer-Dedup liess 10-16 % Re-Feuern durch).',
    anmerkung: 'Q.signalCross/crossCore (quant.js:754-794), 261-Fenster. App-Standard ema/20/15, Hauptzeitrahmen 5m (applySetup), nicht live gehandelt. Praefix-Probe 0/2070 inkl. Reihenende.' },

  { key: 'vwap-abstand', zeitrahmen: ['5m', '15m', '60m'],
    params: { period: 20, zThr: 2.0, schlussAbMin: 375 }, signal: vwapAbstand, freigabe: 'nach reparatur',
    reparatur: 'Signale verworfen, deren Kerzenende >= Minute 375 liegt (60m-19:30-Halbkerze = 31,5 % der 60m-Signale, die der Live-Pfad nie auswertet; 5m ab 19:45). Unvollstaendige Tage (< 80 % Sollkerzen) verwirft das Geschirr - fuer die kumulative VWAP zwingend.',
    anmerkung: 'STUDIEN-DEFINITION ohne Live-Pendant: Q.reversionSignal(bars[0..i], vwap, 20, 2.0) (quant.js:929, vwapLine 775 mit UTC-Tagesreset, Close x Volumen). Kreuz-Variante NICHT aufgenommen (Registrierung). 60m: Tages-VWAP auf 7 Kerzen, erster Bar Abstand 0 - nur als Rangliste.' },

  { key: 'wendepunkt-trendwechsel', zeitrahmen: ['1m', '5m'],
    params: { S: 1.0, F: 5, tagesreihe: 'auto', minTagesKerzen: 59 }, signal: wendepunktTrendwechsel, freigabe: 'nach reparatur',
    reparatur: '(1) Nur die ERSTE Kerze je Abschnitt (Q.trendwechsel feuert an jeder Kerze mit stehender Bedingung; AAPL 348 Kerzen vs 58 Abschnitte). (2) Auf 1m Tagesreihe ab 59 Kerzen (Live: range=1d, depot.js:1099/1995/1102; 14 % der Archiv-Signale sonst live unerreichbar). 5m fortlaufend (Live range=5d).',
    anmerkung: 'Q.trendwechsel (quant.js:2357) / wendepunkte (2111) / kanalUeber (2134); S=1,0 / F=5 sind die UI-Defaults (index.html:924-938), F=5 war keine Zelle der Studie #33. MIN_JUNG effektiv 15. Kein Handel in der App (Beobachtungstabelle).' },

  { key: 'momentum', zeitrahmen: ['60m'],
    params: { rueckblick: 231, luecke: 21, anteil: 0.10, minWerte: 25 }, signal: momentum, freigabe: 'frei', liveReferenz: 'long',
    anmerkung: 'Querschnitt (momentum.js:54-82): Staerke Kurs[d-21]/Kurs[d-252]-1, staerkstes Zehntel = +1 (belegt), schwaechstes = -1 (Studienerweiterung). Feuert nur am ERSTEN 60m-Bar eines Handelstages; braucht das Symbol (params.sym/bars.sym/Fingerabdruck) und laedt das 60m-Universum (114 Aktien, Dezil 11) beim ersten Aufruf. Horizonte 1/3/5 Tage treffen nicht die belegte Kante (63 Tage); Dezil-Zugehoerigkeit wechselt nur an 2,4 % der Tagespaare - wenige unabhaengige Beobachtungen. Installierter Build rechnet noch 210 Tage (Quelle repariert).' },

  { key: 'drift', zeitrahmen: ['60m', '1d'],
    params: { schlussAbMin: 900 }, signal: drift, freigabe: 'nach reparatur', liveReferenz: 'long+short',
    reparatur: '(1) istTagesreihe ueber den kleinsten Kerzenabstand (erste 60m-Kerze nach Wochenende galt als Tageskerze -> Signal 9:30 ET und Doppelzaehlung). (2) Terminhygiene beim Laden: Termine nach archiv.at (Zukunftstermine mit angehaengter Vorquartals-Ueberraschung, 25 Faelle) und Mitternacht-Stempel (UTC 4/5 Uhr, ab 2023: 4 Faelle) verworfen.',
    anmerkung: 'drift.js ereignisse/zuordnen (Rang der Ueberraschung im Universum der letzten 120 Handelstage, oberstes/unterstes Fuenftel). Tabelle einmal je Universum aus mf_tagesdaten/drift_termine/drift_markt; Signal auf der Schlusskerze des Reaktionstags (60m: 15:30 ET). Terminluecke Juni 2025-Juni 2026: Bestaetigungsdrittel Tier B nur 41 Signale aus sechs Wochen, 25 Werte ohne Q2-2026-Zahlen - MDE vor dem Urteil. Gleichtags-Rang haengt von der Symbolreihenfolge ab (2,2 %, kein Zukunftsblick).' },
];

module.exports.helfer = { barMinVon: barMinVon, symVon: symVon, universum60m: universum60m, driftTabelle: driftTabelle };
module.exports.ausgeschlossen = [
  { key: 'wendepunkt-basis', grund: 'Existiert nicht als Funktion (nur REGISTRIERUNG.md:55 nennt den Namen; quant.js:2111 wendepunkte() ist eine Hilfsfunktion ohne Richtung). Als dokumentierte Abweichung streichen.' },
  { key: 'technical-score', grund: 'Kein Kandidat, sondern Bedingung (Technik-Score-Terzil). Die Reparatur (Tagesserie aus Tagesschluessen, Vortagsindex) steckt bereits in messgeschirr.js:131-140/185-191; offen bleibt dort, dass die Terzilgrenzen auch aus Bestaetigungstagen gezogen werden (messgeschirr.js:234-238).' },
  { key: 'vwap-kreuz', grund: 'Vom Pruefer vorgeschlagene Kreuz-Variante signalCross(bars, vwap, 20, 15) - steht nicht in der Kandidatenliste (Registrierung: nichts kommt nachtraeglich hinzu).' },
];
