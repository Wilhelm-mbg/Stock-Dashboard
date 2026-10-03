'use strict';
/* KAPITULATION V2, PHASE 2 - ERTRAGSSTUFE UND DER EINE REGISTRIERTE LAUF (Auftrag Nr. 68, 03.10.2026).
 *
 * Pflichtenheft: VORREGISTRIERUNG.md (registriert, Kennung kapitulation-neu-2026-10-03/v1) mit Nachtrag 1.
 * Diese Datei waehlt nichts und wiederholt nichts: eine Vorhersage, ein Fenster, eine Urteilsgroesse.
 *
 * Zwei Schritte, damit das Archiv (122 GB auf E:, nur lesend) genau EINMAL gelesen wird:
 *   --teil k/4   Archivlauf. Je Reihe zwei Zeilen: lauf/teile/teil-k-von-4.zaehl.ndjson (Zaehlung wie Phase 1 und der volle
 *                Tagestopf: jede zulaessige Kerze ohne Reihentage mit Signal) und teil-k-von-4.ertrag.ndjson - das SIEGEL:
 *                die Ertraege der echten Signale. Das Siegel oeffnet nur Stufe A (N und se) und danach, wenn die Sperre es
 *                erlaubt, Stufe B. Tore 1-5 lesen es nicht. Fortsetzbar: fertige Reihen werden uebersprungen.
 *   --stufen     Die Tore in der Reihenfolge von §6, jedes schreibt seine Datei, bevor das naechste beginnt:
 *                zaehlung.json -> nullpunkt.json -> placebo.json -> leck-klinke.json -> kosten.json -> stufe-a.json ->
 *                (nur bei MDE80 <= 1,107 Pp) stufe-b.json -> nachrichtlich.json -> urteil.json. Ein Abbruch in den Toren
 *                2-4 schreibt abbruch.json und endet; ein neuer Start rechnet dann NICHT weiter (Befund an den PM).
 *   --warten     wartet auf die vier Teile, dann --stufen und --bericht (der abgekoppelte Waechter der Nacht).
 *
 * Kontrolle = Tagestopf (Nachtrag 1): Mittel ueber ALLE zulaessigen Kerzen des ET-Tags in der Umsatzklasse des Signals,
 * gleiche Haltedauer, gleiche Buchung fuer Verschwundene. Keine Ziehung, keine Stichprobe.
 * Ertraege stehen in Millionsteln (ppm) als ganze Zahlen; Ausgaben in Prozentpunkten (Pp).
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var Z = require('./zaehlen.js');
var REPO = path.resolve(__dirname, '..', '..');
var MIN = path.join(REPO, 'studien', 'vorregistrierung-2026-09-06-signale-minuten');
var K = require(path.join(MIN, 'konfig.js'));
var L = require(path.join(MIN, 'lesen.js'));
var ST = require(path.join(REPO, 'studien', 'querschnitt-pruefstand-2026-09-13', 'statistik.js'));
var S = require(path.join(REPO, 'studien', 'messmaschine', 'strategien', 'kapitulation.js'));

var KENNUNG = 'kapitulation-neu-2026-10-03/v1';
var VOR = Z.VOR, H = Z.H, VORLAUF_TAGE = 37;       // 261 Stundenkerzen / 7 je Tag: davor kann keine Reihe ein Signal tragen
var BEST_BIS = '2023-09-25', ALT_BIS = '2026-08-24';   // §4: Bestaetigung bis einschliesslich / altes Fenster bis einschliesslich
var BEHAUPTET = 1.107, TOR1_SE = 0.138, PLACEBO_T = 2;
var Z80 = 1.959964 + 0.8416212;                    // wie Phase 1 und Messmaschine; die Vorregistrierung schreibt gerundet 2,80
/* Totalverlust-Gruende je Regel - dieselbe Liste wie K.EMPFINDLICHKEIT im Pruefstand (dort nur gelesen; test.js haelt beide gegeneinander). */
var REGELN = { haupt: { insolvenz: 1, 'zwangs-delisting': 1 }, streng: { insolvenz: 1, 'zwangs-delisting': 1, unbekannt: 1, freiwillig: 1 }, milde: {} };
var ALT_AUSSCHNITT = VOR + H, ALT_MIN = 20;        // Kontrolle des alten Protokolls: ohne [i-287, i+25], mindestens 20 Kerzen
var LECK_REIHEN = 20, TEILE = 4;
var SAAT = { nullpunkt: KENNUNG + '/nullpunkt', placebo: KENNUNG + '/placebo', leck: KENNUNG + '/leck' };
var STRATEGIE = path.join(REPO, 'studien', 'messmaschine', 'strategien', 'kapitulation.js');
var PROTOKOLL_ALT = path.join(REPO, 'studien', 'messmaschine', 'protokolle', 'kapitulation-2026-08-26.json');
var GRUENDE = path.join(REPO, 'studien', 'verschwundene-gruende-2026-09-12', 'verschwundene-gruende.json');
var LAUF = path.join(__dirname, 'lauf');
var SPY_R = { reihe: 'SPY', ordner: 'SPY', jahre: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026], schnittMs: null, abMs: null };
var PV1 = { liquiditaet: true, regime: false };

function schreib(datei, inhalt) { var t = datei + '.tmp'; fs.writeFileSync(t, typeof inhalt === 'string' ? inhalt : JSON.stringify(inhalt, null, 1)); fs.renameSync(t, datei); }
function lies(datei) { return JSON.parse(fs.readFileSync(datei, 'utf8')); }
function sha(text) { return crypto.createHash('sha256').update(text).digest('hex'); }
function shaDatei(datei) { return sha(fs.readFileSync(datei)); }
function rund(x, n) { var f = Math.pow(10, n == null ? 4 : n); return x == null || !isFinite(x) ? null : Math.round(x * f) / f; }
function num(a, b) { return a - b; }
function fensterVon(tag) { return tag <= BEST_BIS ? 'b' : tag <= ALT_BIS ? 'a' : 'r'; }
function huerde(kl) { return K.KLASSEN[Math.max(0, kl)].huerde; }            // ohne Klasse (Median unter 5 Mio $): die teuerste Huerde
function klName(kl) { return kl < 0 ? 'unter5' : K.KLASSEN[kl].name; }
function echtesSignal(b, i) { return S.signal(b, i, PV1); }

/* ---------- 1. Strategiedatei unveraendert? (Auftrag §1.1; Vorregistrierung §2 letzter Punkt) ---------- */
function strategiePruefung() {
  var jetzt = fs.readFileSync(STRATEGIE, 'utf8'), quelle = lies(PROTOKOLL_ALT).strategie.quelle;
  return { datei: 'studien/messmaschine/strategien/kapitulation.js', zeichen: jetzt.length, zeichenImProtokoll: quelle.length, zeichengleich: jetzt === quelle,
    sha256: sha(jetzt), sha256QuelleImProtokoll: sha(quelle), quantSha256: shaDatei(path.join(REPO, 'quant.js')),
    statistikSha256: shaDatei(path.join(REPO, 'studien', 'querschnitt-pruefstand-2026-09-13', 'statistik.js')) };
}

/* ---------- 2. Ertragsstufe: haengt sich an die Zaehlung einer Reihe (zaehlen.js zaehleReihe, opt.voll) ---------- */
/** Schreibt den vollen Topf in `aus.topf` und gibt das Siegel der Reihe zurueck.
 *  aus.topf: je zulaessigem Reihentag [Kalenderindex, Klasse, Summe Einstiegsluecke, nEnde, r1 ... rn] - r = Schluss[i+26]/Schluss[i]-1
 *  in ppm; die LETZTEN nEnde Kerzen haben keine Ausstiegskerze mehr, weil die Reihe in der Haltedauer endet (dort steht der
 *  Ertrag bis zum letzten Kurs; die Totalverlust-Regel ersetzt ihn in der Auswertung durch -100 %). Lebende Reihen am
 *  Archivende haben keinen Ertrag und fehlen.
 *  Siegel: je messbarem V2-Signal [Nummer in aus.sig, Ertrag ppm (letzter Kurs, wenn die Reihe endet), endet 0/1,
 *  Einstiegsluecke ppm, Erwartung Symbol x Sitzungsposition des alten Protokolls in ppm oder null]. */
function ertragsstufe(aus, x, R, grund) {
  var bars = x.bars, bt = x.bt, tage = x.tage, len = x.len, oe = x.d.oeff, tot = !R.lebend, i, n, ende;
  function ret(j) { return Math.round((bars[j + H < len ? j + H : len - 1][1] / bars[j][1] - 1) * 1e6); }
  function luecke(j) { return oe && j + 1 < len ? Math.round((oe[j + 1] / bars[j][1] - 1) * 1e6) : 0; }
  aus.grund = tot ? (grund || 'unbekannt') : null;
  aus.topf = [];
  var cur = null, curTag = -1;
  for (i = VOR; i < len; i++) {
    n = bt[i]; ende = i + H >= len;
    if (x.flag[i] !== 3 || x.sigTag[n] || x.d.sperr.has(tage[n].tag) || x.splitFenster(i) || (ende && !tot)) continue;
    if (n !== curTag) { cur = [tage[n].ki, x.kl[n], 0, 0]; aus.topf.push(cur); curTag = n; }
    if (ende) cur[3]++; else cur[2] += luecke(i);
    cur.push(ret(i));
  }
  /* Kontrolle des alten Protokolls (nachrichtlich, §5): Erwartung je Symbol x Position im Handelstag, je Fenster getrennt,
   * ueber alle Kerzen mit Vorlauf und Ausstiegskerze, ohne [i-287, i+25] um das bewertete Signal, mindestens 20 Kerzen. */
  var pos = new Int8Array(len), fen = new Int8Array(len), T = {}, t, k;
  for (i = 0; i < len; i++) { pos[i] = i > 0 && bt[i] === bt[i - 1] ? Math.min(15, pos[i - 1] + 1) : 0; fen[i] = 'bar'.indexOf(fensterVon(tage[bt[i]].tag)); }
  for (i = VOR; i < len - H; i++) { k = fen[i] * 16 + pos[i]; t = T[k] || (T[k] = [0, 0]); t[0]++; t[1] += bars[i + H][1] / bars[i][1] - 1; }
  var ert = [];
  aus.sig.forEach(function (s, q) {
    if (!s[2] || s[4] || s[5]) return;                         // nur V2, ohne Sperrtage und Split-Fenster
    var j = x.sigI[q], e = j + H >= len;
    if (e && !tot) return;                                     // lebende Reihe am Archivende: kein Ertrag
    var tt = T[fen[j] * 16 + pos[j]] || [0, 0], nn = tt[0], su = tt[1];
    for (var m = Math.max(VOR, j - ALT_AUSSCHNITT); m <= Math.min(len - H - 1, j + H - 1); m++) if (pos[m] === pos[j] && fen[m] === fen[j]) { nn--; su -= bars[m + H][1] / bars[m][1] - 1; }
    ert.push([q, ret(j), e ? 1 : 0, luecke(j), nn >= ALT_MIN ? Math.round(su / nn * 1e6) : null]);
  });
  return { reihe: R.reihe, ert: ert };
}

/* ---------- 3. Archivlauf eines Teils (abgekoppelt gestartet, fortsetzbar, ohne Doppelzaehlung) ---------- */
function leseJournal(datei) {
  var m = new Map();
  if (!fs.existsSync(datei)) return m;
  fs.readFileSync(datei, 'utf8').split('\n').forEach(function (z) {
    if (!z) return;
    try { var j = JSON.parse(z); if (j && j.reihe && !m.has(j.reihe)) m.set(j.reihe, z); } catch (e) { /* zerrissene letzte Zeile eines abgebrochenen Starts: die Reihe wird neu gerechnet */ }
  });
  return m;
}
function gruendeKarte() { var m = {}; (lies(GRUENDE).reihen || []).forEach(function (r) { m[r.reihe] = r.grund; }); return m; }
function teilLauf(k, n, dir) {
  var teile = path.join(dir, 'teile'); fs.mkdirSync(teile, { recursive: true });
  var basis = path.join(teile, 'teil-' + k + '-von-' + n), dz = basis + '.zaehl.ndjson', de = basis + '.ertrag.ndjson', t0 = Date.now();
  if (fs.existsSync(basis + '.fertig')) { console.log('Teil ' + k + '/' + n + ' liegt fertig vor - nichts zu tun.'); return; }
  var sp = strategiePruefung();
  if (!sp.zeichengleich) throw new Error('Strategiedatei weicht von der Quelle im Protokoll ab - die Registrierung ist hinfaellig, kein Lauf.');
  var wahl = L.reihen().filter(function (r, q) { return q % n === k; }), splits = Z.splitListe(), gr = gruendeKarte();
  var spy = Z.ladeReihe60(SPY_R), regime = Z.regimeAus(spy.bars), kal = K.kalender();
  if (!fs.existsSync(path.join(teile, 'regime.json'))) {
    var offen = {}; spy.bars.forEach(function (b, q) { if (regime.offen(b[0])) offen[spy.tage[spy.barTag[q]].tag] = 1; });
    schreib(path.join(teile, 'regime.json'), { spyKerzen: spy.bars.length, spyTage: spy.tage.length, spyFehl: spy.fehl, tage: kal.tage.map(function (tg) { return offen[tg] ? 1 : 0; }).join('') });
  }
  /* Wiederaufnahme: eine Reihe gilt nur als erledigt, wenn sie in BEIDEN Journalen vollstaendig steht. */
  var jz = leseJournal(dz), je = leseJournal(de), erledigt = [];
  jz.forEach(function (z, r) { if (je.has(r)) erledigt.push(r); });
  if (jz.size || je.size) { schreib(dz, erledigt.map(function (r) { return jz.get(r) + '\n'; }).join('')); schreib(de, erledigt.map(function (r) { return je.get(r) + '\n'; }).join('')); }
  var fertigSet = new Set(erledigt), fz = fs.openSync(dz, 'a'), fe = fs.openSync(de, 'a'), bytes = 0, neu = 0, letzte = Date.now();
  console.log('Teil ' + k + '/' + n + ': ' + wahl.length + ' Reihen, ' + erledigt.length + ' schon erledigt; Strategie sha256 ' + sp.sha256.slice(0, 12));
  wahl.forEach(function (R, idx) {
    if (fertigSet.has(R.reihe)) return;
    var siegel = null;
    var r = Z.zaehleReihe(R, regime, splits, { voll: function (aus, x) { siegel = ertragsstufe(aus, x, R, gr[R.reihe]); } });
    bytes += r.bytes; delete r.msLesen; if (!r.grund && !R.lebend) r.grund = gr[R.reihe] || 'unbekannt';
    if (!siegel) { r.topf = []; siegel = { reihe: R.reihe, ert: [] }; }                 // Reihe kuerzer als der Vorlauf
    fs.writeSync(fe, JSON.stringify(siegel) + '\n'); fs.writeSync(fz, JSON.stringify(r) + '\n'); neu++;
    if (Date.now() - letzte > 60000 || idx === wahl.length - 1) {
      fs.fsyncSync(fe); fs.fsyncSync(fz); letzte = Date.now();
      schreib(basis + '.fortschritt.json', { teil: k + '/' + n, reihenErledigt: erledigt.length + neu, reihenGesamt: wahl.length, zuletzt: R.reihe, gelesenGBDieserStart: rund(bytes / 1e9, 2), minutenDieserStart: rund((Date.now() - t0) / 60000, 1), stand: new Date().toString() });
      console.log(new Date().toISOString() + ' ' + (erledigt.length + neu) + '/' + wahl.length + ' ' + R.reihe + ' ' + (bytes / 1e9).toFixed(1) + ' GB');
    }
  });
  fs.fsyncSync(fe); fs.fsyncSync(fz); fs.closeSync(fe); fs.closeSync(fz);
  schreib(basis + '.fertig', { teil: k + '/' + n, reihen: wahl.length, beendet: new Date().toString(), strategieSha256: sp.sha256, quantSha256: sp.quantSha256, zaehlenSha256: shaDatei(path.join(__dirname, 'zaehlen.js')), messenSha256: shaDatei(__filename) });
  console.log('Teil ' + k + '/' + n + ' fertig: ' + wahl.length + ' Reihen, dieser Start ' + neu + ' Reihen, ' + (bytes / 1e9).toFixed(1) + ' GB, ' + Math.round((Date.now() - t0) / 60000) + ' min');
}

/* ---------- 4. Einlesen der Teile; Topf, Kontrolle, Tagesreihe, Momente ---------- */
function zeilen(datei) { return fs.readFileSync(datei, 'utf8').split('\n').filter(Boolean).map(function (z) { return JSON.parse(z); }); }
function teilBasen(dir) {
  var teile = path.join(dir, 'teile'), f = fs.existsSync(teile) ? fs.readdirSync(teile).filter(function (x) { return /^teil-\d+-von-\d+\.fertig$/.test(x); }) : [];
  if (!f.length) throw new Error('Kein fertiger Teil in ' + teile);
  var n = +f[0].match(/von-(\d+)/)[1], aus = [];
  for (var k = 0; k < n; k++) { var b = path.join(teile, 'teil-' + k + '-von-' + n); if (!fs.existsSync(b + '.fertig')) throw new Error('Teil ' + k + '/' + n + ' ist nicht fertig.'); aus.push(b); }
  return aus;
}
/** Zaehlung und Topf aller Reihen (OHNE Siegel), nach Reihenname sortiert; jede Reihe genau einmal. */
function ladeLauf(dir) {
  var reihen = [], gesehen = new Set(), fertig = [];
  teilBasen(dir).forEach(function (b) {
    var f = lies(b + '.fertig'), z = zeilen(b + '.zaehl.ndjson');
    if (z.length !== f.reihen) throw new Error(path.basename(b) + ': ' + z.length + ' Zeilen, erwartet ' + f.reihen);
    z.forEach(function (r) { if (gesehen.has(r.reihe)) throw new Error('Reihe doppelt: ' + r.reihe); gesehen.add(r.reihe); reihen.push(r); });
    fertig.push(f);
  });
  reihen.sort(function (a, b) { return a.reihe < b.reihe ? -1 : 1; });
  return { reihen: reihen, fertig: fertig };
}
/** Das Siegel: Ertraege der echten Signale. Nur Stufe A, Stufe B und die nachrichtlichen Zeilen rufen das auf. */
function oeffneSiegel(dir) {
  var m = new Map();
  teilBasen(dir).forEach(function (b) { zeilen(b + '.ertrag.ndjson').forEach(function (e) { m.set(e.reihe, e); }); });
  return m;
}
function eintragWert(e, r, p, regel) { return p >= e.length - 4 - e[3] && REGELN[regel][r.grund] ? -1e6 : e[4 + p]; }
function eintragSumme(e, r, regel) { var s = 0; for (var p = 0; p < e.length - 4; p++) s += eintragWert(e, r, p, regel); return s; }
/** Topfzellen je (Kalenderindex, Klasse): n, Summen je Totalverlust-Regel, dasselbe nur fuer lebende Reihen, Luecken-Summe. */
function baueTopf(reihen) {
  var zellen = new Map();
  reihen.forEach(function (r) {
    (r.topf || []).forEach(function (e) {
      var key = e[0] * 8 + e[1] + 1, z = zellen.get(key), m = e.length - 4;
      if (!z) zellen.set(key, z = { n: 0, s: { haupt: 0, streng: 0, milde: 0 }, nL: 0, sL: 0, g: 0, gn: 0, e: [], r: [] });
      z.n += m; Object.keys(REGELN).forEach(function (g) { z.s[g] += eintragSumme(e, r, g); });
      if (r.lebend) { z.nL += m; z.sL += eintragSumme(e, r, 'milde'); }
      z.g += e[2]; z.gn += m - e[3]; z.e.push(e); z.r.push(r);
    });
  });
  return zellen;
}
/** Mittel des Tagestopfs in ppm. Ist die Klasse am Tag leer: ganzer Tagestopf ueber alle Klassen (ersatz = 1); ist auch der leer: null.
 *  o.eigenN / o.eigenS nehmen den eigenen Reihentag eines ZUFALLS-Einstiegs heraus (echte Signaltage stehen nie im Topf). */
function kontrolle(zellen, ki, kl, regel, o) {
  o = o || {};
  function nS(z) { return !z ? [0, 0] : o.luecke ? [z.gn, z.g] : o.nurLebend ? [z.nL, z.sL] : [z.n, z.s[regel]]; }
  var a = nS(zellen.get(ki * 8 + kl + 1)), n = a[0] - (o.eigenN || 0);
  if (n > 0) return { m: (a[1] - (o.eigenS || 0)) / n, ersatz: 0 };
  var N = -(o.eigenN || 0), Sx = -(o.eigenS || 0);
  for (var k = -1; k < 4; k++) { a = nS(zellen.get(ki * 8 + k + 1)); N += a[0]; Sx += a[1]; }
  return N > 0 ? { m: Sx / N, ersatz: 1 } : null;
}
/** liste: [{ki, kl, wert (ppm), eigenN, eigenS}] -> Tagesmittel brutto und netto (Pp), gleichgewichtet ueber die Signale des Tags. */
function tagesreihe(zellen, liste, regel, o) {
  var tage = new Map(), z = { signale: 0, ohneTopf: 0, klassenErsatz: 0 };
  liste.forEach(function (s) {
    var c = zellen ? kontrolle(zellen, s.ki, s.kl, regel, { nurLebend: o && o.nurLebend, luecke: o && o.luecke, eigenN: s.eigenN, eigenS: s.eigenS }) : { m: s.erw, ersatz: 0 };
    if (!c || c.m == null) { z.ohneTopf++; return; }
    z.signale++; z.klassenErsatz += c.ersatz;
    var t = tage.get(s.ki); if (!t) tage.set(s.ki, t = { b: 0, h: 0, n: 0 });
    t.b += (s.wert - c.m) / 1e4; t.h += o && o.ohneKosten ? 0 : huerde(s.kl); t.n++;
  });
  var ks = Array.from(tage.keys()).sort(num);
  return { brutto: ks.map(function (k) { var t = tage.get(k); return { t: k, x: t.b / t.n }; }), netto: ks.map(function (k) { var t = tage.get(k); return { t: k, x: (t.b - t.h) / t.n }; }), zaehler: z };
}
/** Momente ueber Signaltage; se = die groesste aus naiv, Hansen-Hodrick (Rechteckkern, Lag 3) und 5-Tage-Bloecken (§5). */
function mom(p) {
  var h = ST.momente(p, 4), bl = ST.momente(p, 5), se = Math.max(h.seNaiv || 0, h.seHH || 0, bl.seBlock || 0);
  return { n: h.n, sd: h.sd, seNaiv: h.seNaiv, seHH: h.seHH, seBlock: bl.seBlock, se: se, mittel: h.mittel, t: se > 0 ? h.mittel / se : null, band: [h.mittel - 1.96 * se, h.mittel + 1.96 * se] };
}
function nurStreuung(m) { return { signaltage: m.n, sdJeSignaltag: rund(m.sd), seNaiv: rund(m.seNaiv), seHansenHodrick: rund(m.seHH), seBloecke: rund(m.seBlock), se: rund(m.se), mde80: rund(Z80 * m.se) }; }
function mitMittel(m) { var o = nurStreuung(m); o.mittelPp = rund(m.mittel); o.band95 = [rund(m.band[0]), rund(m.band[1])]; o.t = rund(m.t, 2); return o; }
/** Die echten V2-Signale mit Ertrag unter einer Totalverlust-Regel (braucht das Siegel). */
function signalListe(reihen, siegel, regel) {
  var aus = [];
  reihen.forEach(function (r) {
    var e = siegel.get(r.reihe); if (!e) return;
    e.ert.forEach(function (x) { var s = r.sig[x[0]]; aus.push({ ki: s[0], kl: s[1], r: r, wert: x[2] && REGELN[regel][r.grund] ? -1e6 : x[1], ende: x[2], luecke: x[3], erw: x[4] }); });
  });
  return aus;
}

/* ---------- 5. Die Tore ---------- */
/** Tor 1: Vollzaehlung, blind (kein Ertrag). */
function vollzaehlung(reihen, kal, regimeTage) {
  function leer() { return { signale: 0, aufVerschwundenen: 0, tage: new Set() }; }
  function buch(m, k, s, r) { var o = m[k] || (m[k] = leer()); o.signale++; if (!r.lebend) o.aufVerschwundenen++; o.tage.add(s[0]); }
  function fertig(m) { var a = {}; Object.keys(m).sort().forEach(function (k) { a[k] = { signale: m[k].signale, signaltage: m[k].tage.size, aufVerschwundenen: m[k].aufVerschwundenen }; }); return a; }
  var V = { v1: { gesamt: {}, fenster: {}, jahr: {}, klasse: {}, fensterKlasse: {} }, v2: { gesamt: {}, fenster: {}, jahr: {}, klasse: {}, fensterKlasse: {} } };
  var arch = { reihen: reihen.length, lebend: 0, verschwunden: 0, jahresdateien: 0, gelesenGB: 0, kerzen60m: 0, jahresdateienFehlen: 0, reihenMitV2Signal: 0, topfReihentage: 0, topfKerzen: 0, topfKerzenReiheEndet: 0 };
  var rand = { sperrtagMassnahme: 0, splitFenster: 0, v2ReiheEndetInHaltedauer: 0, v2OhneAusstiegArchivende: 0, klinkeUmsatztor: 0 }, jeTagB = new Map();
  reihen.forEach(function (r) {
    if (r.lebend) arch.lebend++; else arch.verschwunden++;
    arch.jahresdateien += r.dateien; arch.gelesenGB += r.bytes / 1e9; arch.kerzen60m += r.kerzen; arch.jahresdateienFehlen += r.fehl.length; rand.klinkeUmsatztor += r.klinke;
    (r.topf || []).forEach(function (e) { arch.topfReihentage++; arch.topfKerzen += e.length - 4; arch.topfKerzenReiheEndet += e[3]; });
    var hat = false;
    r.sig.forEach(function (s) {
      if (s[5]) { rand.splitFenster++; return; }
      if (s[4]) { rand.sperrtagMassnahme++; return; }
      var f = { b: 'bestaetigung', a: 'altesFenster', r: 'rueckhalt' }[fensterVon(kal[s[0]])];
      ['v1', 'v2'].forEach(function (v) {
        if (v === 'v2' && !s[2]) return;
        buch(V[v].gesamt, 'alle', s, r); buch(V[v].fenster, f, s, r); buch(V[v].jahr, kal[s[0]].slice(0, 4), s, r); buch(V[v].klasse, klName(s[1]), s, r); buch(V[v].fensterKlasse, f + ' | ' + klName(s[1]), s, r);
      });
      if (!s[2]) return;
      hat = true;
      if (!s[3]) { if (r.lebend) rand.v2OhneAusstiegArchivende++; else rand.v2ReiheEndetInHaltedauer++; }
      if (f === 'bestaetigung') jeTagB.set(s[0], (jeTagB.get(s[0]) || 0) + 1);
    });
    if (hat) arch.reihenMitV2Signal++;
  });
  arch.gelesenGB = rund(arch.gelesenGB, 2);
  var zahlen = Array.from(jeTagB.values()).sort(num), su = zahlen.reduce(function (a, b) { return a + b; }, 0);
  function q(p) { return zahlen.length ? zahlen[Math.min(zahlen.length - 1, Math.floor(p * zahlen.length))] : null; }
  var offen = null;
  if (regimeTage) { offen = { bestaetigung: 0, altesFenster: 0, rueckhalt: 0 }; kal.forEach(function (t, d) { if (regimeTage[d] === '1' && d >= VORLAUF_TAGE) offen[{ b: 'bestaetigung', a: 'altesFenster', r: 'rueckhalt' }[fensterVon(t)]]++; }); }
  var ausV = {}; ['v1', 'v2'].forEach(function (v) { ausV[v] = { gesamt: fertig(V[v].gesamt).alle || { signale: 0, signaltage: 0, aufVerschwundenen: 0 }, jeFenster: fertig(V[v].fenster), jeJahr: fertig(V[v].jahr), jeKlasse: fertig(V[v].klasse), jeFensterUndKlasse: fertig(V[v].fensterKlasse) }; });
  var b = ausV.v2.jeFenster.bestaetigung || { signale: 0, signaltage: 0, aufVerschwundenen: 0 };
  return { kennung: KENNUNG, tor: '1 Vollzaehlung, blind', erstellt: new Date().toString(), blind: 'kein Ertrag gerechnet oder gelesen; das Siegel blieb zu',
    fenster: { bestaetigung: 'erster signalfaehiger Tag ... ' + BEST_BIS, altesFenster: 'bis ' + ALT_BIS, rueckhalt: 'danach', kalenderVon: kal[0], kalenderBis: kal[kal.length - 1], ersterSignalfaehigerTag: kal[VORLAUF_TAGE] || null },
    archiv: arch, regimeOffeneTageAbVorlauf: offen, v1OhneRegime: ausV.v1, v2: ausV.v2, raender: rand,
    haeufungV2Bestaetigung: { signaltage: zahlen.length, signale: su, mittelJeSignaltag: zahlen.length ? rund(su / zahlen.length, 2) : null, median: q(0.5), p95: q(0.95), max: zahlen.length ? zahlen[zahlen.length - 1] : null },
    gegenSchaetzungPhase1: { signaltageBestaetigungGezaehlt: b.signaltage, schaetzungModell: 403, schaetzungGeeicht: 493, sicherVon: 154, sicherBis: 683, inDerSpanne403Bis493: b.signaltage >= 403 && b.signaltage <= 493 } };
}
/** Messbare V2-Hauptsignale des Bestaetigungsfensters je Tag x Klasse - aus der Zaehlung, ohne Ertrag. */
function bedarfAus(reihen, kal) {
  var m = new Map();
  reihen.forEach(function (r) { r.sig.forEach(function (s) { if (!s[2] || s[4] || s[5] || !(s[3] || !r.lebend) || fensterVon(kal[s[0]]) !== 'b') return; var k = s[0] * 8 + s[1] + 1; m.set(k, (m.get(k) || 0) + 1); }); });
  return m;
}
/** Tor 2, Nullpunkt: je Signaltag x Klasse so viele ZUFAELLIGE zulaessige Kerzen wie Signale, gleichverteilt aus dem Topf. */
function nullpunktListe(zellen, bedarf, saat) {
  var aus = [];
  Array.from(bedarf.keys()).sort(num).forEach(function (key) {
    var z = zellen.get(key); if (!z || !z.n) return;
    var rng = ST.mulberry32(ST.fnv(saat + '|' + key)), zug = new Set(), ziel = Math.min(bedarf.get(key), z.n);
    while (zug.size < ziel) zug.add(Math.floor(rng() * z.n));
    var ord = Array.from(zug).sort(num), o = 0, basis = 0;
    for (var j = 0; j < z.e.length && o < ord.length; j++) {
      var e = z.e[j], m = e.length - 4;
      for (; o < ord.length && ord[o] < basis + m; o++) aus.push({ ki: e[0], kl: e[1], wert: eintragWert(e, z.r[j], ord[o] - basis, 'haupt'), eigenN: m, eigenS: eintragSumme(e, z.r[j], 'haupt') });
      basis += m;
    }
  });
  return aus;
}
/** Tor 3, Placebo ohne Kursbezug: je Signaltag so viele Reihentage wie Signale, gewaehlt nach dem Streuwert aus Kuerzel und Datum;
 *  die Kerze des Tages bestimmt derselbe Streuwert. Kein Kurs geht in die Wahl ein. */
function placeboListe(zellen, bedarf, kal, saat) {
  var jeTag = new Map(), aus = [];
  bedarf.forEach(function (n, key) { var ki = Math.floor(key / 8); jeTag.set(ki, (jeTag.get(ki) || 0) + n); });
  Array.from(jeTag.keys()).sort(num).forEach(function (ki) {
    var kand = [];
    for (var kl = -1; kl < 4; kl++) { var z = zellen.get(ki * 8 + kl + 1); if (z) for (var j = 0; j < z.e.length; j++) kand.push({ u: ST.fnv(saat + '|' + z.r[j].reihe + '|' + kal[ki]), e: z.e[j], r: z.r[j] }); }
    kand.sort(function (a, b) { return a.u - b.u || (a.r.reihe < b.r.reihe ? -1 : 1); });
    kand.slice(0, jeTag.get(ki)).forEach(function (c) { var m = c.e.length - 4, p = Math.floor(ST.mulberry32(c.u)() * m); aus.push({ ki: ki, kl: c.e[1], wert: eintragWert(c.e, c.r, p, 'haupt'), eigenN: m, eigenS: eintragSumme(c.e, c.r, 'haupt') }); });
  });
  return aus;
}
function torZeile(name, saat, zellen, liste, bedarf) {
  var T = tagesreihe(zellen, liste, 'haupt', { ohneKosten: true }), m = mom(T.brutto), o = mitMittel(m), soll = 0;
  if (bedarf) bedarf.forEach(function (n) { soll += n; });
  o.kennung = KENNUNG; o.tor = name; o.saat = saat; o.erstellt = new Date().toString(); o.signaleImFenster = bedarf ? soll : null; o.eintraege = T.zaehler.signale; o.ohneTopf = T.zaehler.ohneTopf; o.schranke = '|t| < ' + PLACEBO_T;
  o.bestanden = m.t != null && Math.abs(m.t) < PLACEBO_T;
  return o;
}
/** Tor 4, Leck-Klinke an einer Reihe: der Ausloeser feuert auf dem Praefix bars[0..i] genau dort, wo er auf der ganzen Reihe feuert;
 *  das Regime-Urteil entsteht aus SPY-Kerzen STRENG vor dem Signalstempel (Praefix der SPY-Reihe = ganze Reihe). */
function leckKlinke(bars, sigF, spyBars, regimeGeprueft) {
  var regime = regimeGeprueft || Z.regimeAus(spyBars), aus = { kerzen: Math.max(0, bars.length - VOR), feuer: 0, abweichungAusloeser: 0, regimeGeprueft: 0, abweichungRegime: 0 };
  for (var i = VOR; i < bars.length; i++) {
    var ganz = !!sigF(bars, i), praefix = !!sigF(bars.slice(0, i + 1), i);
    if (ganz !== praefix) aus.abweichungAusloeser++;
    if (!ganz) continue;
    aus.feuer++; aus.regimeGeprueft++;
    var ms = bars[i][0], lo = 0, hi = regime.zeit.length;
    while (lo < hi) { var m = (lo + hi) >> 1; if (regime.zeit[m] < ms) lo = m + 1; else hi = m; }
    var davor = spyBars.slice(0, lo), streng = !davor.length || davor[davor.length - 1][0] < ms;
    if (!streng || Z.regimeAus(davor).offen(ms) !== regime.offen(ms)) aus.abweichungRegime++;
  }
  return aus;
}
function leckStufe(reihen, ctx) {
  var kal = ctx.kal, kand = reihen.filter(function (r) { return r.sig.some(function (s) { return s[2] && !s[4] && !s[5] && fensterVon(kal[s[0]]) === 'b'; }); });
  kand.sort(function (a, b) { return ST.fnv(SAAT.leck + '|' + a.reihe) - ST.fnv(SAAT.leck + '|' + b.reihe) || (a.reihe < b.reihe ? -1 : 1); });
  var spy = ctx.spy(), sigF = ctx.signal || echtesSignal, je = [], abw = 0;
  kand.slice(0, LECK_REIHEN).forEach(function (r) {
    var x = leckKlinke(ctx.lade(r.reihe), sigF, spy);
    x.reihe = r.reihe; x.feuerInDerZaehlung = r.sig.length; x.gleichDerZaehlung = x.feuer === r.sig.length;
    abw += x.abweichungAusloeser + x.abweichungRegime + (x.gleichDerZaehlung ? 0 : 1); je.push(x);
    if (ctx.log) ctx.log('Leck-Klinke ' + r.reihe + ': ' + x.kerzen + ' Kerzen, ' + x.feuer + ' Ausloeser, Abweichungen ' + (x.abweichungAusloeser + x.abweichungRegime));
  });
  return { kennung: KENNUNG, tor: '4 Leck-Klinke', saat: SAAT.leck, erstellt: new Date().toString(), wahl: 'Reihen mit mindestens einem V2-Signal im Bestaetigungsfenster, geordnet nach Streuwert der Saat, die ersten ' + LECK_REIHEN,
    reihen: je.length, kerzenGeprueft: je.reduce(function (a, x) { return a + x.kerzen; }, 0), ausloeserGeprueft: je.reduce(function (a, x) { return a + x.feuer; }, 0), abweichungen: abw, bestanden: abw === 0 && je.length === Math.min(LECK_REIHEN, kand.length) && je.length > 0, jeReihe: je };
}
/** Tor 5, Kosten vor dem Urteil: Huerde je Klasse und Klassen-Mix der messbaren Signale im Bestaetigungsfenster. */
function kostenStufe(bedarf) {
  var je = {}, n = 0, su = 0, tage = new Set();
  bedarf.forEach(function (z, key) { var kl = key % 8 - 1, k = klName(kl); je[k] = (je[k] || 0) + z; n += z; su += z * huerde(kl); tage.add(Math.floor(key / 8)); });
  var mix = {}; Object.keys(je).sort().forEach(function (k) { mix[k] = { signale: je[k], anteil: rund(je[k] / n) }; });
  return { kennung: KENNUNG, tor: '5 Kosten', erstellt: new Date().toString(), huerdeJeUmlaufPp: K.KLASSEN.map(function (k) { return { klasse: k.name, pp: k.huerde }; }), ohneKlasse: 'Signale mit Median unter 5 Mio $ tragen die Huerde der Klasse 5-50',
    signaleMessbar: n, signaltage: tage.size, klassenMix: mix, mittlereHuerdeJeSignalPp: n ? rund(su / n) : null };
}
function imFenster(liste, kal, f) { return liste.filter(function (s) { return fensterVon(kal[s.ki]) === f; }); }
/** Stufe A: N und se der echten Signale - KEIN Mittel, kein t, kein Band. */
function stufeA(ctx, reihen, zellen) {
  var sig = imFenster(signalListe(reihen, oeffneSiegel(ctx.dir), 'haupt'), ctx.kal, 'b'), T = tagesreihe(zellen, sig, 'haupt'), m = mom(T.netto), a = nurStreuung(m);
  var ver = sig.filter(function (s) { return !s.r.lebend; }).length;
  a.kennung = KENNUNG; a.stufe = 'A: N und se, das Mittel bleibt zu'; a.erstellt = new Date().toString(); a.groesse = 'Tagesmittel des Netto-Ueberschusses gegen den Tagestopf, Pp je Signaltag';
  a.signale = T.zaehler.signale; a.ohneTopf = T.zaehler.ohneTopf; a.klasseAmTagLeerGanzerTagestopf = T.zaehler.klassenErsatz;
  a.mde80 = Z80 * m.se; a.mde80Mit280 = rund(2.80 * m.se); a.schwelleMde80 = BEHAUPTET; a.stufeBGesperrt = !(a.mde80 <= BEHAUPTET);
  a.tor1Muehle = { seNoetig: TOR1_SE, se: rund(m.se), erreicht: m.se <= TOR1_SE };
  a.tor2Muehle = 'vorab verfehlt: MDE80 liegt weit ueber jeder Kassa-Huerde (0,045 ... 0,157 Pp) - die Messung prueft die Behauptung, nicht die Huerde';
  a.aufVerschwundenen = { signale: ver, anteil: sig.length ? rund(ver / sig.length) : null };
  a.totalverlustBuchungen = sig.filter(function (s) { return s.ende && REGELN.haupt[s.r.grund]; }).length;
  a.letzterKursBuchungen = sig.filter(function (s) { return s.ende && !REGELN.haupt[s.r.grund]; }).length;
  return a;
}
function de(x, n) { return (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(n == null ? 3 : n).replace('.', ','); }
function dz(x, n) { return x.toFixed(n == null ? 3 : n).replace('.', ','); }
/** Satzform nach §9. Rangfolge (vor dem Lauf festgelegt): nicht entscheidbar -> bestaetigt (a > 0) -> in der behaupteten Groesse
 *  zurueckgewiesen (b < 1,107) -> nicht bestaetigt. */
function urteilAus(a, m) {
  var zusatz = 'N = ' + a.signaltage + ' Signaltage, se = ' + dz(a.se) + ' Pp, MDE₈₀ = ' + dz(a.mde80) + ' Pp, ' + dz(100 * a.aufVerschwundenen.anteil, 1) + ' % der Signale auf Verschwundenen, ' + a.totalverlustBuchungen + ' Totalverlust-Buchungen.';
  if (!m) return { form: 'nicht entscheidbar', satz: 'Nicht entscheidbar: MDE₈₀ = ' + dz(a.mde80) + ' > 1,107 Pp bei ' + a.signaltage + ' Signaltagen; das Mittel wurde nicht geöffnet.', zusatz: zusatz };
  var band = '[' + de(m.band[0]) + '; ' + de(m.band[1]) + ']';
  if (m.band[0] > 0) return { form: 'bestätigt', satz: 'Bestätigt: V2 netto ' + de(m.mittel) + ' Pp je Signaltag, Band ' + band + ' über null, ' + m.n + ' Signaltage, Placebos gehalten.', zusatz: zusatz };
  if (m.band[1] < BEHAUPTET) return { form: 'in der behaupteten Größe zurückgewiesen', satz: 'In der behaupteten Größe zurückgewiesen: obere Grenze ' + de(m.band[1]) + ' < 1,107 Pp (V2 netto ' + de(m.mittel) + ' Pp je Signaltag, Band ' + band + ').', zusatz: zusatz };
  return { form: 'nicht bestätigt', satz: 'Nicht bestätigt: Band ' + band + ' schließt null ein bei MDE₈₀ = ' + dz(a.mde80) + ' ≤ 1,107 Pp; ein Effekt der behaupteten Größe wäre aufgefallen.', zusatz: zusatz };
}
/** Stufe B: Mittel, Band, t. ZWEI-STUFEN-SPERRE: ohne stufe-a.json auf der Platte oder bei MDE80 > 1,107 Pp wird nicht gerechnet. */
function stufeB(ctx, reihen, zellen) {
  var pa = path.join(ctx.dir, 'stufe-a.json');
  if (!fs.existsSync(pa)) throw new Error('SPERRE: Stufe A liegt nicht auf der Platte - Stufe B wird nicht gerechnet.');
  var a = lies(pa);
  if (a.stufeBGesperrt !== false || !(a.mde80 <= BEHAUPTET)) throw new Error('SPERRE: MDE80 = ' + a.mde80 + ' Pp > 1,107 Pp - das Mittel bleibt zu.');
  var sig = imFenster(signalListe(reihen, oeffneSiegel(ctx.dir), 'haupt'), ctx.kal, 'b'), T = tagesreihe(zellen, sig, 'haupt'), m = mom(T.netto), u = urteilAus(a, m);
  return { kennung: KENNUNG, stufe: 'B: Mittel, Band, t', erstellt: new Date().toString(), netto: mitMittel(m), brutto: mitMittel(mom(T.brutto)), schwelleT: 1.96, urteil: u, _m: m };
}
/** Nachrichtliche Zeilen (§4/§5/§7), ohne Urteil. offen = false (Stufe B gesperrt): nur N und se je Zeile. */
function nachrichtlich(ctx, reihen, zellen, offen, a) {
  var kal = ctx.kal, siegel = oeffneSiegel(ctx.dir), zeilenAus = {}, zeig = offen ? mitMittel : nurStreuung;
  function zeile(name, T, extra) { var o = { netto: zeig(mom(T.netto)), brutto: zeig(mom(T.brutto)), signale: T.zaehler.signale, ohneKontrolle: T.zaehler.ohneTopf }; if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); zeilenAus[name] = o; return o; }
  var haupt = signalListe(reihen, siegel, 'haupt'), hb = imFenster(haupt, kal, 'b'), ha = imFenster(haupt, kal, 'a');
  zeile('altesFensterAlle', tagesreihe(zellen, ha, 'haupt'), { fenster: '2023-09-26 ... ' + ALT_BIS, aufVerschwundenen: ha.filter(function (s) { return !s.r.lebend; }).length });
  zeile('altesFensterNurLebend', tagesreihe(zellen, ha.filter(function (s) { return s.r.lebend; }), 'haupt', { nurLebend: true }), { hinweis: 'Signale und Topf nur aus lebenden Reihen' });
  var kiEnde = 0; kal.forEach(function (t, d) { if (t <= BEST_BIS) kiEnde = d; });
  var mitte = VORLAUF_TAGE + Math.floor((kiEnde - VORLAUF_TAGE + 1) / 2);
  zeile('bestaetigungHaelfte1', tagesreihe(zellen, hb.filter(function (s) { return s.ki < mitte; }), 'haupt'), { bis: kal[mitte - 1] });
  zeile('bestaetigungHaelfte2', tagesreihe(zellen, hb.filter(function (s) { return s.ki >= mitte; }), 'haupt'), { ab: kal[mitte] });
  zeile('kontrolleAltesProtokoll', tagesreihe(null, hb, 'haupt'), { kontrolle: 'Erwartung Symbol x Position im Handelstag, je Fenster, ohne [i-287, i+25], mindestens 20 Kerzen' });
  zeile('einstiegsluecke', tagesreihe(zellen, hb.map(function (s) { return { ki: s.ki, kl: s.kl, wert: s.luecke }; }), 'haupt', { luecke: true, ohneKosten: true }), { groesse: 'Eroeffnung der naechsten Stundenkerze gegen den Schluss der Signalkerze, zentriert gegen dieselbe Groesse im Tagestopf' });
  var hm = offen ? mom(tagesreihe(zellen, hb, 'haupt').netto) : null;
  ['streng', 'milde'].forEach(function (g) {
    var l = imFenster(signalListe(reihen, siegel, g), kal, 'b'), T = tagesreihe(zellen, l, g), m = mom(T.netto), extra = { regel: g === 'streng' ? 'Totalverlust auch fuer unbekannt und freiwillig' : 'letzter Kurs fuer alle', totalverlustBuchungen: l.filter(function (s) { return s.ende && REGELN[g][s.r.grund]; }).length };
    if (offen) { var u = urteilAus(Object.assign({}, a, { signaltage: m.n, se: m.se, mde80: Z80 * m.se }), Z80 * m.se <= BEHAUPTET ? m : null); extra.differenzZurHauptzahlPp = rund(m.mittel - hm.mittel); extra.urteilsformUnterDieserRegel = u.form; }
    zeile('empfindlichkeit' + (g === 'streng' ? 'Streng' : 'Milde'), T, extra);
  });
  var hr = imFenster(haupt, kal, 'r'), tageR = new Set(hr.map(function (s) { return s.ki; }));
  zeilenAus.rueckhalt = { fenster: 'ab 2026-08-25', signaltage: tageR.size, signale: hr.length, hinweis: 'kein Urteil vor 100 Signaltagen; nichts gerechnet' };
  return { kennung: KENNUNG, erstellt: new Date().toString(), ohneUrteil: true, mittelGeoeffnet: offen, zeilen: zeilenAus };
}

/* ---------- 6. Die Kette der Stufen ---------- */
function stufen(ctx) {
  var dir = ctx.dir, log = ctx.log || function () {};
  function p(n) { return path.join(dir, n); }
  function da(n) { return fs.existsSync(p(n)); }
  if (da('abbruch.json')) { log('abbruch.json liegt vor - kein Weiterrechnen ohne Rueckfrage beim PM.'); return { abbruch: lies(p('abbruch.json')) }; }
  var G = ladeLauf(dir), reihen = G.reihen, kal = ctx.kal, zellen = null, bedarf = bedarfAus(reihen, kal);
  function topf() { return zellen || (zellen = baueTopf(reihen)); }
  function abbruch(tor, befund) { var o = { kennung: KENNUNG, abbruchIn: tor, befund: befund, zeit: new Date().toString(), folge: 'Befund an den PM; kein Reparieren und Neustarten ohne Rueckfrage. Das Siegel blieb zu.' }; schreib(p('abbruch.json'), o); log('ABBRUCH in ' + tor); return { abbruch: o }; }
  function stufe(name, f) { if (da(name)) { log(name + ' liegt vor - nicht neu gerechnet.'); return lies(p(name)); } var o = f(); schreib(p(name), o); log(name + ' geschrieben.'); return o; }
  var regimeTage = null; try { regimeTage = lies(path.join(dir, 'teile', 'regime.json')).tage; } catch (e) { regimeTage = null; }
  stufe('zaehlung.json', function () { return vollzaehlung(reihen, kal, regimeTage); });
  var t2 = stufe('nullpunkt.json', function () { return torZeile('2 Nullpunkt: Zufallseinstiege an den Signaltagen gegen den Tagestopf', SAAT.nullpunkt, topf(), nullpunktListe(topf(), bedarf, SAAT.nullpunkt), bedarf); });
  if (!t2.bestanden) return abbruch('Tor 2 Nullpunkt', t2);
  var t3 = stufe('placebo.json', function () { return torZeile('3 Placebo ohne Kursbezug: Streuwert aus Kuerzel und Datum, gleiche Haeufigkeit je Tag', SAAT.placebo, topf(), placeboListe(topf(), bedarf, kal, SAAT.placebo), bedarf); });
  if (!t3.bestanden) return abbruch('Tor 3 Placebo', t3);
  var t4 = stufe('leck-klinke.json', function () { return leckStufe(reihen, ctx); });
  if (!t4.bestanden) return abbruch('Tor 4 Leck-Klinke', t4);
  stufe('kosten.json', function () { return kostenStufe(bedarf); });
  var a = stufe('stufe-a.json', function () { return stufeA(ctx, reihen, topf()); }), b = null;
  if (!a.stufeBGesperrt) b = stufe('stufe-b.json', function () { var o = stufeB(ctx, reihen, topf()); delete o._m; return o; });
  var u = b ? b.urteil : urteilAus(a, null);
  stufe('nachrichtlich.json', function () { return nachrichtlich(ctx, reihen, topf(), !!b, a); });
  stufe('urteil.json', function () { return { kennung: KENNUNG, erstellt: new Date().toString(), form: u.form, satz: u.satz, zusatz: u.zusatz, tor1Muehle: a.tor1Muehle, tor2Muehle: a.tor2Muehle }; });
  return { urteil: u };
}

/* ---------- 7. Bericht: ERGEBNIS.md und protokoll.json, jede Zahl aus den JSON-Dateien des Laufs ---------- */
function bericht(dir, ziel) {
  function j(n) { var f = path.join(dir, n); return fs.existsSync(f) ? lies(f) : null; }
  var zl = j('zaehlung.json'), n2 = j('nullpunkt.json'), n3 = j('placebo.json'), n4 = j('leck-klinke.json'), ko = j('kosten.json'), a = j('stufe-a.json'), b = j('stufe-b.json'), na = j('nachrichtlich.json'), ur = j('urteil.json'), ab = j('abbruch.json'), lf = j('laeufe.json');
  var sp = strategiePruefung(), M = [];
  function tor(o) { return o ? 'Mittel ' + de(o.mittelPp) + ' Pp, se ' + dz(o.se) + ', t ' + de(o.t, 2) + ' über ' + o.signaltage + ' Signaltage (' + o.eintraege + ' Einstiege) — ' + (o.bestanden ? 'gehalten' : 'GERISSEN') : 'nicht gerechnet'; }
  function nz(o, feld) { var x = o[feld]; return x.mittelPp == null ? '— | — | —' : de(x.mittelPp) + ' | [' + de(x.band95[0]) + '; ' + de(x.band95[1]) + '] | ' + de(x.t, 2); }
  M.push('# Kapitulation V2 auf dem sauberen Archiv — Ergebnis des registrierten Laufs (Auftrag Nr. 68)', '');
  if (ur) M.push('**' + ur.satz + '** ' + ur.zusatz, '');
  else if (ab) M.push('**Kein Urteil: der Lauf ist in ' + ab.abbruchIn + ' abgebrochen.** Das Mittel der echten Signale wurde nicht geöffnet; Befund an den PM.', '');
  else M.push('**Kein Urteil: der Lauf ist nicht zu Ende.**', '');
  M.push('Kennung `' + KENNUNG + '`. Eine Vorhersage, eine Messung (Testzahl 1). Jede Zahl dieser Datei steht in `lauf/*.json` und wurde von `messen.js --bericht` hierher geschrieben. Simulation mit virtuellem Kapital, keine Anlageberatung.', '');
  if (a) M.push('Tor 1 der Mühle (se ≤ ' + dz(TOR1_SE) + ' Pp): ' + (a.tor1Muehle.erreicht ? 'erreicht' : '**verfehlt**') + ' (se ' + dz(a.se) + ' Pp). Tor 2: vorab verfehlt — MDE₈₀ liegt weit über jeder Kassa-Hürde; die Messung prüft die Behauptung, nicht die Hürde. Über Kosten-Tauglichkeit sagt sie nichts.', '');
  M.push('## Tore, in der Reihenfolge der Vorregistrierung §6', '');
  M.push('0. **Strategiedatei unverändert:** ' + (sp.zeichengleich ? 'zeichengleich' : 'WEICHT AB') + ' mit der Quelle im Protokoll vom 26.08.2026 (' + sp.zeichen + ' Zeichen, sha256 `' + sp.sha256.slice(0, 16) + '…`).');
  if (zl) {
    var v2 = zl.v2, fb = v2.jeFenster.bestaetigung || { signale: 0, signaltage: 0, aufVerschwundenen: 0 }, fa = v2.jeFenster.altesFenster || { signale: 0, signaltage: 0 }, fr = v2.jeFenster.rueckhalt || { signale: 0, signaltage: 0 }, g = zl.gegenSchaetzungPhase1;
    M.push('1. **Vollzählung, blind:** ' + zl.archiv.reihen + ' Reihen (' + zl.archiv.lebend + ' lebend, ' + zl.archiv.verschwunden + ' verschwunden), ' + zl.archiv.jahresdateien + ' Jahresdateien, ' + dz(zl.archiv.gelesenGB, 1) + ' GB. V2-Signale ' + v2.gesamt.signale + ' an ' + v2.gesamt.signaltage + ' Signaltagen; **Bestätigungsfenster ' + fb.signaltage + ' Signaltage** (' + fb.signale + ' Signale) — die Schätzung der Phase 1 war ' + g.schaetzungModell + ' … ' + g.schaetzungGeeicht + ' (sicher ' + g.sicherVon + ' … ' + g.sicherBis + ')' + (g.inDerSpanne403Bis493 ? ', getroffen' : ', **nicht getroffen**') + '. Altes Fenster ' + fa.signaltage + ' Signaltage (' + fa.signale + ' Signale), Rückhaltefenster ' + fr.signaltage + ' (' + fr.signale + ').');
  }
  M.push('2. **Nullpunkt** (Zufallseinstiege an den Signaltagen gegen den Tagestopf, |t| < 2): ' + tor(n2) + '.');
  M.push('3. **Placebo ohne Kursbezug** (Streuwert aus Kürzel und Datum, gleiche Häufigkeit je Tag, |t| < 2): ' + tor(n3) + '.');
  M.push('4. **Leck-Klinke:** ' + (n4 ? n4.reihen + ' Reihen, ' + n4.kerzenGeprueft + ' Kerzen und ' + n4.ausloeserGeprueft + ' Auslöser geprüft, Abweichungen ' + n4.abweichungen + ' — ' + (n4.bestanden ? 'gehalten' : 'GERISSEN') : 'nicht gerechnet') + '.');
  if (ko) M.push('5. **Kosten vor dem Urteil:** Hürde je Umlauf ' + ko.huerdeJeUmlaufPp.map(function (h) { return h.klasse + ' Mio $: ' + dz(h.pp, 4) + ' Pp'; }).join(' · ') + '. Klassen-Mix der ' + ko.signaleMessbar + ' messbaren Signale: ' + Object.keys(ko.klassenMix).map(function (k) { return k + ' ' + dz(100 * ko.klassenMix[k].anteil, 1) + ' %'; }).join(' · ') + '; mittlere Hürde ' + dz(ko.mittlereHuerdeJeSignalPp, 4) + ' Pp je Signal.');
  if (a) M.push('6. **Stufe A (se vor dem Mittel):** N = ' + a.signaltage + ' Signaltage (' + a.signale + ' Signale), sd ' + dz(a.sdJeSignaltag) + ' Pp je Signaltag; se naiv ' + dz(a.seNaiv) + ' / Hansen-Hodrick ' + (a.seHansenHodrick == null ? '—' : dz(a.seHansenHodrick)) + ' / Blöcke ' + (a.seBloecke == null ? '—' : dz(a.seBloecke)) + ' ⇒ es gilt **' + dz(a.se) + ' Pp**; MDE₈₀ = ' + dz(a.mde80) + ' Pp ' + (a.stufeBGesperrt ? '> 1,107 — **Stufe B gesperrt, das Mittel blieb zu**' : '≤ 1,107 — Stufe B geöffnet') + '. Auf Verschwundenen ' + a.aufVerschwundenen.signale + ' Signale (' + dz(100 * a.aufVerschwundenen.anteil, 1) + ' %); Reihe endet in der Haltedauer: ' + a.totalverlustBuchungen + ' als Totalverlust, ' + a.letzterKursBuchungen + ' zum letzten Kurs gebucht. Signale ohne Topf ' + a.ohneTopf + ', Klasse am Tag leer (ganzer Tagestopf) ' + a.klasseAmTagLeerGanzerTagestopf + '.');
  if (b) M.push('   **Stufe B:** netto ' + de(b.netto.mittelPp) + ' Pp je Signaltag, Band [' + de(b.netto.band95[0]) + '; ' + de(b.netto.band95[1]) + '], t ' + de(b.netto.t, 2) + ' (Schwelle 1,96); brutto ' + de(b.brutto.mittelPp) + ' Pp, t ' + de(b.brutto.t, 2) + '.');
  M.push('');
  if (na) {
    M.push('## Nachrichtlich, ohne Urteil', '', na.mittelGeoeffnet ? 'Erst nach Stufe B gerechnet. Keine dieser Zeilen ist ein Test; sie ändern das Urteil nicht.' : 'Stufe B blieb gesperrt: je Zeile nur N und se, kein Mittel.', '', '| Zeile | Signaltage | Signale | se (Pp) | netto (Pp) | Band | t | brutto (Pp) |', '|---|---:|---:|---:|---:|---|---:|---:|');
    var namen = { altesFensterAlle: 'altes Fenster, alle Reihen', altesFensterNurLebend: 'altes Fenster, nur lebend', bestaetigungHaelfte1: 'Bestätigungsfenster, erste Hälfte', bestaetigungHaelfte2: 'Bestätigungsfenster, zweite Hälfte', kontrolleAltesProtokoll: 'gegen die Kontrolle des alten Protokolls', einstiegsluecke: 'Einstiegslücke S9 (kein Ertrag, ohne Kosten)', empfindlichkeitStreng: 'Totalverlust auch für unbekannt/freiwillig', empfindlichkeitMilde: 'letzter Kurs für alle' };
    Object.keys(namen).forEach(function (k) { var o = na.zeilen[k]; if (o) M.push('| ' + namen[k] + ' | ' + o.netto.signaltage + ' | ' + o.signale + ' | ' + (o.netto.se == null ? '—' : dz(o.netto.se)) + ' | ' + nz(o, 'netto') + ' | ' + (o.brutto.mittelPp == null ? '—' : de(o.brutto.mittelPp)) + ' |'); });
    M.push('');
    var es = na.zeilen.empfindlichkeitStreng, em = na.zeilen.empfindlichkeitMilde;
    if (b && es && em) {
      var haengt = es.urteilsformUnterDieserRegel !== b.urteil.form || em.urteilsformUnterDieserRegel !== b.urteil.form || Math.max(Math.abs(es.differenzZurHauptzahlPp), Math.abs(em.differenzZurHauptzahlPp)) >= Math.max(Math.abs(b.netto.mittelPp), b.netto.se);
      M.push('Totalverlust-Empfindlichkeit: streng ' + de(es.differenzZurHauptzahlPp) + ' Pp, milde ' + de(em.differenzZurHauptzahlPp) + ' Pp gegen die Hauptzahl (' + es.totalverlustBuchungen + ' bzw. ' + em.totalverlustBuchungen + ' Totalverlust-Buchungen); Urteilsform unter den beiden Regeln: „' + es.urteilsformUnterDieserRegel + '“ / „' + em.urteilsformUnterDieserRegel + '“. ' + (haengt ? '**Das Ergebnis hängt von der Buchung der Verschwundenen ab.**' : 'Das Ergebnis hängt nicht von der Buchung der Verschwundenen ab (Differenz kleiner als Effekt und se, gleiche Urteilsform).'), '');
    }
    if (na.zeilen.rueckhalt) M.push('Rückhaltefenster (ab 2026-08-25): ' + na.zeilen.rueckhalt.signaltage + ' Signaltage, ' + na.zeilen.rueckhalt.signale + ' Signale — kein Urteil vor 100 Signaltagen, nichts gerechnet.', '');
  }
  if (zl) {
    M.push('## Zähler der Vollzählung', '', '| Jahr | V2-Signale | Signaltage | auf Verschwundenen |', '|---|---:|---:|---:|');
    Object.keys(zl.v2.jeJahr).forEach(function (y) { var o = zl.v2.jeJahr[y]; M.push('| ' + y + ' | ' + o.signale + ' | ' + o.signaltage + ' | ' + o.aufVerschwundenen + ' |'); });
    M.push('', '| Klasse (Mio $) | V2-Signale | Signaltage | auf Verschwundenen |', '|---|---:|---:|---:|');
    Object.keys(zl.v2.jeKlasse).forEach(function (k) { var o = zl.v2.jeKlasse[k]; M.push('| ' + k + ' | ' + o.signale + ' | ' + o.signaltage + ' | ' + o.aufVerschwundenen + ' |'); });
    var h = zl.haeufungV2Bestaetigung, r = zl.raender;
    M.push('', 'Ohne Regime (V1, nur gezählt): ' + zl.v1OhneRegime.gesamt.signale + ' Signale an ' + zl.v1OhneRegime.gesamt.signaltage + ' Tagen. Häufung im Bestätigungsfenster: im Mittel ' + dz(h.mittelJeSignaltag, 2) + ' Signale je Signaltag, Median ' + h.median + ', P95 ' + h.p95 + ', Maximum ' + h.max + '. Ränder: ' + r.sperrtagMassnahme + ' Signale an Sperrtagen und ' + r.splitFenster + ' in Split-Fenstern (§8) ausgeschlossen; ' + r.v2ReiheEndetInHaltedauer + ' V2-Signale, deren Reihe in der Haltedauer endet (nach §7 gebucht); ' + r.v2OhneAusstiegArchivende + ' am Archivende lebender Reihen ohne Ertrag; Klinke Umsatztor ' + r.klinkeUmsatztor + ' Abweichungen; ' + zl.archiv.jahresdateienFehlen + ' geführte Jahresdateien fehlen auf der Platte. Tagestopf: ' + zl.archiv.topfKerzen + ' zulässige Kerzen an ' + zl.archiv.topfReihentage + ' Reihentagen, ohne Ziehung.', '');
  }
  M.push('## Dateien', '', '`lauf/zaehlung.json` · `nullpunkt.json` · `placebo.json` · `leck-klinke.json` · `kosten.json` · `stufe-a.json` · `stufe-b.json` · `nachrichtlich.json` · `urteil.json` · `laeufe.json`; zusammengefasst in `protokoll.json`. Die Journale je Reihe (`lauf/teile/`, samt Siegel) liegen auf der Platte und sind nicht eingecheckt.', '');
  schreib(path.join(ziel, 'ERGEBNIS.md'), M.join('\n'));
  schreib(path.join(ziel, 'protokoll.json'), { kennung: KENNUNG, erstellt: new Date().toString(), strategie: sp, zaehlung: zl, tore: { nullpunkt: n2, placebo: n3, leckKlinke: n4, kosten: ko }, stufeA: a, stufeB: b, urteil: ur, abbruch: ab, nachrichtlich: na, laeufe: lf });
}

/* ---------- 8. Aufruf ---------- */
function echtCtx() {
  return { dir: LAUF, kal: K.kalender().tage, log: function (t) { console.log(new Date().toISOString() + ' ' + t); },
    spy: function () { return Z.ladeReihe60(SPY_R).bars; },
    lade: function (name) { var R = L.reihen().filter(function (r) { return r.reihe === name; })[0]; return Z.ladeReihe60(R).bars; } };
}
function kette() {
  var sp = strategiePruefung();
  if (!sp.zeichengleich) throw new Error('Strategiedatei weicht von der Quelle im Protokoll ab - kein Lauf.');
  var ctx = echtCtx(), e = stufen(ctx);
  bericht(LAUF, __dirname);
  ctx.log(e.abbruch ? 'ABBRUCH: ' + e.abbruch.abbruchIn : 'URTEIL: ' + e.urteil.satz);
  schreib(path.join(LAUF, 'stufen.fertig'), { beendet: new Date().toString(), abbruch: !!e.abbruch });
}
function haupt(argv) {
  var a = argv[0];
  if (a === '--teil') { var t = argv[1].split('/'); teilLauf(+t[0], +t[1], LAUF); }
  else if (a === '--stufen') kette();
  else if (a === '--bericht') bericht(LAUF, __dirname);
  else if (a === '--strategie') console.log(JSON.stringify(strategiePruefung(), null, 1));
  else if (a === '--vermerk') {
    fs.mkdirSync(LAUF, { recursive: true });
    var f = path.join(LAUF, 'laeufe.json'), l = fs.existsSync(f) ? lies(f) : [];
    l.push({ zeit: new Date().toString(), grund: argv[1] || 'ohne Angabe', gestartet: argv[2] || '', strategieSha256: strategiePruefung().sha256 }); schreib(f, l);
  } else if (a === '--warten') {
    var fertig = function () { for (var k = 0; k < TEILE; k++) if (!fs.existsSync(path.join(LAUF, 'teile', 'teil-' + k + '-von-' + TEILE + '.fertig'))) return false; return true; };
    var takt = function () { if (!fertig()) { setTimeout(takt, 60000); return; } console.log(new Date().toISOString() + ' alle ' + TEILE + ' Teile fertig - Stufen beginnen.');
      try { kette(); } catch (e) { console.log('TECHNISCHER ABBRUCH: ' + (e.stack || e)); schreib(path.join(LAUF, 'stufen.fehler.json'), { zeit: new Date().toString(), fehler: String(e.stack || e) }); process.exitCode = 1; } };
    console.log(new Date().toISOString() + ' Waechter wartet auf ' + TEILE + ' Teile.'); takt();
  } else console.log('Aufruf: messen.js --teil k/4 | --warten | --stufen | --bericht | --strategie | --vermerk <Grund> <Teile>');
}

module.exports = { KENNUNG: KENNUNG, REGELN: REGELN, Z80: Z80, BEHAUPTET: BEHAUPTET, SAAT: SAAT, BEST_BIS: BEST_BIS, strategiePruefung: strategiePruefung, ertragsstufe: ertragsstufe, leseJournal: leseJournal,
  ladeLauf: ladeLauf, oeffneSiegel: oeffneSiegel, baueTopf: baueTopf, kontrolle: kontrolle, tagesreihe: tagesreihe, mom: mom, signalListe: signalListe, vollzaehlung: vollzaehlung, bedarfAus: bedarfAus,
  nullpunktListe: nullpunktListe, placeboListe: placeboListe, torZeile: torZeile, leckKlinke: leckKlinke, kostenStufe: kostenStufe, stufeA: stufeA, stufeB: stufeB, urteilAus: urteilAus, nachrichtlich: nachrichtlich,
  stufen: stufen, bericht: bericht, huerde: huerde, fensterVon: fensterVon, teilLauf: teilLauf };
if (require.main === module) haupt(process.argv.slice(2));
