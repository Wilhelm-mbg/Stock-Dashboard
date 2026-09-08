'use strict';
/* TAGESBALKEN - ein Lesedurchlauf ueber das Minutenarchiv, je Reihe eine kompakte Tagesdatei (VORREGISTRIERUNG §1, §14).
 *
 *   node tagesbalken.js --aus tage [--reihen A B C] [--teil k/n] [--max N] [--jahre 2024] [--wachhund SEK] [--neu] [--ohne-spy]
 *
 *   --aus       Ausgabeordner (relativ zu diesem Ordner). tage/ fuer den Vollauf, tage-pilot/ fuer Proben.
 *   --reihen    nur diese Reihen (Pilot; setzt pilot=true im Fortschritt). SPY wird immer mitgelesen (Marktreihe),
 *               ausser mit --ohne-spy.
 *   --teil k/n  nur jede n-te Reihe ab k - mehrere Prozesse, jeder mit eigenem --aus; messen.js liest alle Ordner.
 *   --max N     hoechstens N Reihen in diesem Lauf.
 *   --jahre     nur diese Jahre lesen (Kreuzprobe-Werte, nicht fuer die Messung).
 *   --wachhund  Sekunden je Datei; eine langsamere Datei wird protokolliert (das Lesen ist synchron, es kann nicht
 *               unterbrochen werden - der Wachhund ist hier ein Zaehler, kein Abbruch).
 *   --neu       vorhandenen Fortschritt ignorieren (der Ordner wird genannt).
 *
 * NUR LESEN auf E:. Jede Jahresdatei wird genau einmal gelesen (leseJson: einmal nach 5 s wiederholen, dann
 * "ausgelassen"). Eine Reihe ist fertig, wenn ihre Datei tage/<REIHE>.json atomar geschrieben ist; ein Neustart
 * ueberspringt fertige Reihen (_fortschritt.json). Fortsetzbar, ganz oder gar nicht je Reihe.
 *
 * Warum nicht lesen.js ladeJahr(): das liefert nur die regulaeren Kerzen (bis 15:59) - die 16:00-Kerze mit der
 * Schlussauktion liegt im Bereich `nach` und wird dort verworfen. Hier wird sie je Tag mitgenommen (Kandidaten C1/C2).
 * Reihen, Massnahmen, Rohfaktor, ET-Zeit und Pfade kommen unveraendert aus lesen.js.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var L = K.L;

function argumente(argv) {
  var a = { aus: null, reihen: null, teil: null, max: 0, jahre: null, wachhund: 300, neu: false, ohneSpy: false };
  for (var i = 0; i < argv.length; i++) {
    var x = argv[i];
    if (x === '--aus') a.aus = argv[++i];
    else if (x === '--reihen') { a.reihen = []; while (i + 1 < argv.length && argv[i + 1].slice(0, 2) !== '--') a.reihen.push(argv[++i]); }
    else if (x === '--jahre') { a.jahre = []; while (i + 1 < argv.length && argv[i + 1].slice(0, 2) !== '--') String(argv[++i]).split(',').forEach(function (j) { if (j) a.jahre.push(+j); }); }
    else if (x === '--teil') { var p = String(argv[++i]).split('/'); a.teil = { k: +p[0], n: +p[1] }; }
    else if (x === '--max') a.max = +argv[++i];
    else if (x === '--wachhund') a.wachhund = +argv[++i];
    else if (x === '--neu') a.neu = true;
    else if (x === '--ohne-spy') a.ohneSpy = true;
  }
  return a;
}

/* ---------- Lesen einer Jahresdatei mit 16:00-Kerze ---------- */
function schlafe(ms) { var t = Date.now(); while (Date.now() - t < ms) { /* warten - der Anhang der App ist gleich fertig */ } }
function leseJson(pfad) {
  for (var versuch = 0; versuch < 2; versuch++) {
    try { var text = fs.readFileSync(pfad, 'utf8'); return { ok: true, json: JSON.parse(text), bytes: text.length }; }
    catch (e) { if (versuch === 0) schlafe(5000); else return { ok: false, grund: e.message }; }
  }
}
/** Tage eines Symbol-Jahres: [{tag, o, h, l, c1, c2, c3, v, nReg, flags, t0}] nach §1.1, dazu quelle, angewandt, rohFaktor, verworfen. */
function ladeJahrTage(R, jahr) {
  var d = L.dateiPfad(R, jahr);
  if (!fs.existsSync(d.pfad)) return { ok: false, grund: 'Datei fehlt', pfad: d.pfad, quelle: d.quelle };
  var g = leseJson(d.pfad);
  if (!g.ok) return { ok: false, grund: g.grund, pfad: d.pfad, quelle: d.quelle };
  var j = g.json, serie = j.series || [];
  if (!Array.isArray(serie)) return { ok: false, grund: 'series fehlt', pfad: d.pfad, quelle: d.quelle };
  var vonMs = L.etTagMs(K.FENSTER.von), bisMs = L.etTagMs(K.FENSTER.bis) + 86400000 - 1;
  var reg = (j.sitzungen || []).filter(function (b) { return b.sitzung === 'regulaer'; }).sort(function (a, b) { return a.von - b.von; });
  var verworfen = { unsortiert: 0, ausserFenster: 0, lebenszeit: 0, nichtRegulaer: 0, ohneKurs: 0 };
  var tage = [], si = 0, letzt = -1;
  function zulaessig(k) {
    var t = k[0];
    if (!(t > letzt)) { verworfen.unsortiert++; return false; }
    letzt = t;
    if (t < vonMs || t > bisMs) { verworfen.ausserFenster++; return false; }
    if ((R.schnittMs != null && t > R.schnittMs) || (R.abMs != null && t < R.abMs)) { verworfen.lebenszeit++; return false; }
    if (!(k[1] > 0) || !(k[5] > 0)) { verworfen.ohneKurs++; return false; }
    return true;
  }
  for (var ri = 0; ri < reg.length; ri++) {
    var b = reg[ri], kerzen = [], k16 = null;
    while (si < serie.length && serie[si][0] < b.von) { if (serie[si][0] > letzt) { letzt = serie[si][0]; verworfen.nichtRegulaer++; } si++; }
    while (si < serie.length && serie[si][0] <= b.bis) { var k = serie[si++]; if (zulaessig(k)) kerzen.push(k); }
    if (si < serie.length && serie[si][0] === b.bis + 60000) { var kk = serie[si]; if (zulaessig(kk)) k16 = kk; }
    if (!kerzen.length) continue;
    var o = kerzen[0][5], h = -Infinity, l = Infinity, v = 0, flags = 0;
    for (var q = 0; q < kerzen.length; q++) { var x = kerzen[q]; if (x[3] > h) h = x[3]; if (x[4] < l) l = x[4]; v += x[2] || 0; }
    if (k16) { if (k16[3] > h) h = k16[3]; if (k16[4] < l) l = k16[4]; v += k16[2] || 0; } else flags |= K.FLAG.c16fehlt;
    if (kerzen[0][0] !== b.von) flags |= K.FLAG.oSpaet;
    var c3 = kerzen[kerzen.length - 1][1];
    tage.push({ tag: L.tagVon(kerzen[0][0]), t0: kerzen[0][0], o: o, h: h, l: l, c1: k16 ? k16[5] : c3, c2: k16 ? k16[1] : c3, c3: c3, v: v, nReg: kerzen.length, flags: flags });
  }
  /* Massnahmen im Kopf der bereinigten Kopie -> angewandt (art|ex) und Rueckrechnung auf den Rohkurs, wie lesen.js ladeJahr */
  var angewandt = new Set(), rueck = [], mm = j.massnahmen;
  if (Array.isArray(mm)) mm.forEach(function (m) {
    var ex = m.ex_date || m.ex || m.datum; if (!ex) return;
    if (m._art) angewandt.add(m._art + '|' + ex); else if (m.art) angewandt.add(m.art + '|' + ex);
    if (m.faktor > 0) rueck.push({ exMs: L.etTagMs(ex), faktor: m.faktor });
  });
  else if (mm && typeof mm === 'object') Object.keys(mm).forEach(function (kk2) { var m = mm[kk2]; var ex = (m && (m.ex_date || m.ex || m.datum)) || kk2; var art = (m && (m._art || m.art)) || ''; if (ex) angewandt.add(art + '|' + ex); });
  rueck.sort(function (a, b) { return a.exMs - b.exMs; });
  return { ok: true, tage: tage, quelle: d.quelle, pfad: d.pfad, angewandt: angewandt, bytes: g.bytes, kerzenGesamt: serie.length, verworfen: verworfen, rohFaktor: L.rohFaktorFunktion(rueck) };
}

/* ---------- Eine Reihe ---------- */
function protokoll(ordner, zeile) {
  var s = new Date().toISOString() + '  ' + zeile;
  console.log(s);
  try { fs.appendFileSync(path.join(ordner, '_lauf.log'), s + '\n'); } catch (e) { /* Log ist Komfort */ }
}
/** Liest alle Jahre einer Reihe und schreibt tage/<REIHE>.json. Rueckgabe Kennzahlen; wirft nie (Fehler landen in ausgelassen). */
function baueReihe(R, ordner, a, kal) {
  var jahre = R.jahre.filter(function (j) { return j >= +K.FENSTER.von.slice(0, 4) && j <= +K.FENSTER.bis.slice(0, 4) && (!a.jahre || a.jahre.indexOf(j) !== -1); });
  var massnahmen = L.massnahmenFuer(R);
  var D = { kennung: K.KONFIG_KENNUNG, reihe: R.reihe, ordner: R.ordner, lebend: R.lebend, art: R.art, gruppe: R.gruppe, ende: massnahmen.ende || null,
    massnahmenDatei: !massnahmen.fehlt, quelleJeJahr: {}, ausgelassen: [], verworfen: { unsortiert: 0, ausserFenster: 0, lebenszeit: 0, nichtRegulaer: 0, ohneKurs: 0 },
    tageOhneKalender: 0, tag: [], o: [], h: [], l: [], c1: [], c2: [], c3: [], v: [], nReg: [], roh: [], flags: [] };
  var ms = 0, bytes = 0, dateien = 0, langsam = 0;
  jahre.forEach(function (jahr) {
    var t0 = Date.now(), g = ladeJahrTage(R, jahr), dt = Date.now() - t0;
    ms += dt; if (dt > a.wachhund * 1000) langsam++;
    if (!g.ok) { D.ausgelassen.push({ jahr: jahr, grund: g.grund }); return; }
    dateien++; bytes += g.bytes; D.quelleJeJahr[jahr] = g.quelle;
    Object.keys(g.verworfen).forEach(function (k) { D.verworfen[k] += g.verworfen[k]; });
    var sperr = L.ausschlussTage(R, massnahmen, g.quelle, g.angewandt);
    g.tage.forEach(function (T) {
      var idx = kal.idx[T.tag];
      if (idx === undefined) { D.tageOhneKalender++; return; }
      if (D.tag.length && idx <= D.tag[D.tag.length - 1]) { D.verworfen.unsortiert++; return; }
      D.tag.push(idx); D.o.push(r4(T.o)); D.h.push(r4(T.h)); D.l.push(r4(T.l)); D.c1.push(r4(T.c1)); D.c2.push(r4(T.c2)); D.c3.push(r4(T.c3));
      D.v.push(Math.round(T.v)); D.nReg.push(T.nReg); D.roh.push(r6(g.rohFaktor(T.t0))); D.flags.push(T.flags | (sperr.has(T.tag) ? K.FLAG.massnahmen : 0));
    });
  });
  var pfad = path.join(ordner, R.reihe + '.json'), tmp = pfad + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(D));
  fs.renameSync(tmp, pfad);
  return { dateien: dateien, bytes: bytes, ms: ms, tage: D.tag.length, ausgelassen: D.ausgelassen.length, langsam: langsam };
}
function r4(x) { return Math.round(x * 10000) / 10000; }
function r6(x) { return Math.round(x * 1000000) / 1000000; }

/** SPY als Marktreihe (ETF, kein Kandidat) aus den Meta-Dateien. */
function spyReihe() {
  var m = L.meta(), e = m.lebenszeit.SPY;
  if (!e) throw new Error('SPY fehlt in _lebenszeit.json - keine Marktreihe');
  return { reihe: 'SPY', ordner: L.ordnerFuer('SPY'), lebend: 1, jahre: (e.jahre || []).slice().sort(), gruppe: m.gruppe.SPY || 'etf', art: 'ETF', schnittMs: null, abMs: null, markt: true };
}

/* ---------- Der Lauf ---------- */
function lauf(a) {
  if (!a.aus) { console.error('Pflichtargument --aus <ordner> fehlt (tage/ oder tage-pilot/).'); process.exit(2); }
  var ordner = path.resolve(K.HIER, a.aus);
  fs.mkdirSync(ordner, { recursive: true });
  var kal = K.kalender();
  var fp = path.join(ordner, '_fortschritt.json'), F;
  if (!a.neu && fs.existsSync(fp)) {
    F = JSON.parse(fs.readFileSync(fp, 'utf8'));
    if (F.kennung !== K.KONFIG_KENNUNG) { console.error('Fortschritt in ' + ordner + ' gehoert zu einer anderen Konfiguration (' + F.kennung + ') - Abbruch.'); process.exit(4); }
    protokoll(ordner, 'FORTSETZUNG: ' + Object.keys(F.erledigt).length + ' Reihen erledigt');
  } else {
    if (a.neu && fs.existsSync(fp)) protokoll(ordner, 'NEU: vorhandener Fortschritt in ' + ordner + ' wird ueberschrieben');
    F = { kennung: K.KONFIG_KENNUNG, begonnen: new Date().toISOString(), pilot: !!a.reihen || !!a.jahre, reihenArg: a.reihen, jahreArg: a.jahre, teil: a.teil, nTage: kal.tage.length,
      erledigt: {}, reihen: 0, dateien: 0, bytes: 0, ms: 0, tage: 0, ausgelassen: 0, langsam: 0, fehler: [], reihenAusgeschlossen: null };
  }
  var alle = L.reihen();
  F.reihenAusgeschlossen = alle.ausgeschlossen || null;
  var reihen = alle;
  if (a.reihen) { var soll = new Set(a.reihen); reihen = alle.filter(function (R) { return soll.has(R.reihe); }); var fehlen = a.reihen.filter(function (r) { return r !== 'SPY' && !alle.some(function (R) { return R.reihe === r; }); }); if (fehlen.length) protokoll(ordner, 'WARNUNG: verlangte Reihen ohne Balken/keine Aktie: ' + fehlen.join(' ')); }
  if (a.teil) reihen = reihen.filter(function (R, i) { return i % a.teil.n === a.teil.k; });
  if (!a.ohneSpy && (!a.teil || a.teil.k === 0)) reihen = [spyReihe()].concat(reihen);      // Marktreihe zuerst, nur im Teil 0
  protokoll(ordner, 'START ' + K.KONFIG_KENNUNG + ' | ' + reihen.length + ' Reihen (' + alle.length + ' Aktien, ausgeschlossen ' + JSON.stringify(alle.ausgeschlossen) + ') | Tage ' + kal.tage.length + (a.reihen ? ' | PILOT' : '') + (a.jahre ? ' | JAHRE ' + a.jahre.join(',') : '') + (a.teil ? ' | Teil ' + a.teil.k + '/' + a.teil.n : ''));
  var stop = false, inDiesemLauf = 0, tStart = Date.now();
  process.on('SIGINT', function () { stop = true; protokoll(ordner, 'SIGINT - nach dieser Reihe wird gesichert und beendet'); });
  function sichern() { var tmp = fp + '.tmp'; F.stand = new Date().toISOString(); fs.writeFileSync(tmp, JSON.stringify(F)); fs.renameSync(tmp, fp); }
  for (var ri = 0; ri < reihen.length && !stop; ri++) {
    var R = reihen[ri];
    if (F.erledigt[R.reihe] && fs.existsSync(path.join(ordner, R.reihe + '.json'))) continue;
    if (a.max && inDiesemLauf >= a.max) break;
    var t0 = Date.now(), s;
    try { s = baueReihe(R, ordner, a, kal); }
    catch (e) { F.fehler.push({ reihe: R.reihe, fehler: e && e.message }); protokoll(ordner, 'FEHLER ' + R.reihe + ': ' + (e && e.stack || e)); continue; }
    F.erledigt[R.reihe] = { dateien: s.dateien, tage: s.tage, ms: Date.now() - t0, ausgelassen: s.ausgelassen };
    F.reihen++; F.dateien += s.dateien; F.bytes += s.bytes; F.ms += s.ms; F.tage += s.tage; F.ausgelassen += s.ausgelassen; F.langsam += s.langsam; inDiesemLauf++;
    protokoll(ordner, R.reihe.padEnd(10) + String(s.dateien).padStart(3) + ' Dateien ' + String(s.tage).padStart(5) + ' Tage ' + (s.bytes / 1e6).toFixed(0).padStart(5) + ' MB ' + String(Date.now() - t0).padStart(6) + ' ms' + (s.ausgelassen ? '  ausgelassen ' + s.ausgelassen : '') + (s.langsam ? '  LANGSAM ' + s.langsam : ''));
    if (inDiesemLauf % 25 === 0) sichern();
  }
  F.beendet = stop ? 'SIGINT' : (a.max && inDiesemLauf >= a.max ? 'max erreicht' : 'vollstaendig');
  sichern();
  protokoll(ordner, 'ENDE ' + F.beendet + ' | ' + F.reihen + ' Reihen | ' + F.dateien + ' Dateien | ' + (F.bytes / 1e9).toFixed(2) + ' GB | ' + Math.round(F.ms / 1000) + ' s lesen | ' + Math.round((Date.now() - tStart) / 1000) + ' s dieser Lauf | ausgelassen ' + F.ausgelassen + ' | Fehler ' + F.fehler.length);
  return F;
}

module.exports = { lauf: lauf, argumente: argumente, ladeJahrTage: ladeJahrTage, baueReihe: baueReihe, spyReihe: spyReihe, leseJson: leseJson };
if (require.main === module) lauf(argumente(process.argv.slice(2)));
