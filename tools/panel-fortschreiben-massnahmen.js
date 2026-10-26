'use strict';
/* MASSNAHMEN-NACHTRAG FUER DIE PANEL-FORTSCHREIBUNG (Auftrag Nr. 123, Entscheid PM 23.10.2026 Nr. 3)
 *
 *   tools\panel-fortschreiben.cmd ruft:  node tools/panel-fortschreiben-massnahmen.js [--stamm <ordner>] [--bis YYYY-MM-DD]
 *
 * Holt die Kapitalmassnahmen NUR fuer die lebenden Reihen des Stamm-Panels (nicht das Universum) ueber den vorhandenen
 * Nachtrag-Weg (studien/datenfundament-2026-10-04/abrufe/a-massnahmen-nachtrag.js: dieselbe Adresse, dieselben Arten,
 * dieselbe Satz-Zuordnung je Kuerzel, derselbe Takt RATE_JE_MIN aus tools/alpaca-vollsammlung.js, 429/5xx-Wiederholung),
 * mit `symbols=` in Bloecken zu 50 Kuerzeln und Zeitfenstern bis 85 Tage. Zeitraum: 15 Kalendertage vor dem Stamm-Ende
 * bis 120 Tage nach heute (die Quelle filtert nach process_date, das bei Ausschuettungen hinter dem Ex-Tag liegt).
 * Ergebnis in den NEUEN Ordner E:/Markt-Dashboard-Archiv/alpaca-massnahmen-nachtrag-YYYY-MM/ (Monat des Abruftags) - liegt
 * er schon vollstaendig (_nachtrag.json), wird nichts geholt und nichts ueberschrieben. Die alten Ordner werden nur gelesen.
 * NIE tools/alpaca-vollsammlung.js --massnahmen (Vollauf, verboten).
 *
 * MASSSTAB-SYMBOLE (Auftrag Nr. 126, QS F3, 26.10.2026): die Index-ETFs der Massstaebe (QQQ, SPY) sind keine Panel-Reihen; ihre
 * Ausschuettungen braucht der Massstab Nasdaq-100 nach Steuer (App: massstab-qqq, Pruefstrasse: daten/qqq-tage.json). Die Liste steht in
 * tools/panel-fortschreiben-massnahmen.konfig.json (massstabSymbole) und wird bei jedem Lauf mitgeholt.
 *   node tools/panel-fortschreiben-massnahmen.js --nur-massstab --von YYYY-MM-DD   holt NUR die Massstab-Symbole, in den eigenen Ordner
 *   alpaca-massnahmen-nachtrag-massstab-YYYY-MM (der Monatsordner des Panel-Laufs bleibt unberuehrt).
 *
 * ZUGANG: nur ueber studien/vorregistrierung-2026-09-02-spannen-historisch/schluessel.js (kopfzeilen(), verdecken());
 * die .cmd holt ihn aus Wilhelms Benutzerprofil. Er steht nie in einer Adresse, nie in einer Datei, nie im Protokoll.
 * Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var REPO = path.join(__dirname, '..');
var NT = require(path.join(REPO, 'studien', 'datenfundament-2026-10-04', 'abrufe', 'a-massnahmen-nachtrag.js'));

var BLOCK = 50, FENSTER_TAGE = 85, VOR_TAGE = 15, NACH_TAGE = 120, VERSUCHE = 5, SEITEN_DECKEL = 300;

function plusTage(t, n) { return new Date(Date.parse(t + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
function pause(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function atomar(p, text) { fs.writeFileSync(p + '.tmp', text); fs.renameSync(p + '.tmp', p); }
function ordnerName(sym) { return String(sym).replace(/[\\/:*?"<>|]/g, '_'); }

/** opt = { wurzel, symbole[], von, bis, ordnerName, block, rate (je Minute), kopfzeilen(), verdecken(), fetch } -> Promise */
async function holen(opt) {
  var log = [], verd = opt.verdecken || function (t) { return t; }, ON = opt.ordnerNameFn || ordnerName;
  function sag(t) { var z = verd(String(t)); log.push(z); if (!opt.still) process.stdout.write(z + '\n'); }
  var ziel = path.join(opt.wurzel, opt.ordnerName), fertig = path.join(ziel, '_nachtrag.json');
  if (fs.existsSync(fertig)) { sag('Nachtrag liegt schon vollstaendig: ' + fertig + ' - nichts geholt'); return { ok: true, schonDa: true, ausgabe: log.join('\n') }; }
  var holeUrl = opt.fetch || globalThis.fetch, rate = opt.rate || 170, marken = [], Z = { abrufe: 0, wiederholt: 0, fehler: {} };
  async function takt() {
    for (;;) { var j = Date.now(); while (marken.length && j - marken[0] > 60000) marken.shift(); if (marken.length < rate) { marken.push(j); return; } await pause(Math.max(20, 60000 - (j - marken[0]) + 5)); }
  }
  async function hole(url) {
    for (var v = 1; v <= VERSUCHE; v++) {
      await takt(); Z.abrufe++;
      var res, text;
      try { res = await holeUrl(url, { headers: opt.kopfzeilen(), signal: AbortSignal.timeout(90000) }); text = await res.text(); }
      catch (e) { Z.fehler.netz = (Z.fehler.netz || 0) + 1; if (v === VERSUCHE) return { status: 0 }; Z.wiederholt++; await pause(1000 * v); continue; }
      if (res.status === 429) { Z.fehler['429'] = (Z.fehler['429'] || 0) + 1; Z.wiederholt++; var w = Number(res.headers.get('retry-after')); await pause(isFinite(w) && w > 0 ? w * 1000 : 2000 * v); continue; }
      if (res.status >= 500) { Z.fehler['http' + res.status] = (Z.fehler['http' + res.status] || 0) + 1; if (v === VERSUCHE) return { status: res.status }; Z.wiederholt++; await pause(1000 * v); continue; }
      if (res.status !== 200) { Z.fehler['http' + res.status] = (Z.fehler['http' + res.status] || 0) + 1; return { status: res.status }; }
      var d = null; try { d = JSON.parse(text); } catch (e2) { d = null; }
      return { status: 200, daten: d };
    }
    return { status: 0 };
  }
  var symbole = opt.symbole.slice().sort(), block = opt.block || BLOCK, alle = [], gesehen = {}, beginn = Date.now();
  var fenster = []; for (var a = opt.von; a <= opt.bis; a = plusTage(a, FENSTER_TAGE + 1)) { var e = plusTage(a, FENSTER_TAGE); fenster.push([a, e < opt.bis ? e : opt.bis]); }
  for (var b = 0; b < symbole.length; b += block) {
    var teil = symbole.slice(b, b + block).join(',');
    for (var f = 0; f < fenster.length; f++) {
      var token = null, seiten = 0;
      do {
        var r = await hole(NT.adresse(teil, fenster[f][0], fenster[f][1], token));
        if (r.status !== 200) { sag('Abbruch: HTTP ' + r.status + ' (Block ' + (b / block + 1) + ', Fenster ' + fenster[f].join('..') + ') - nichts geschrieben'); return { ok: false, ausgabe: log.join('\n'), zaehler: Z }; }
        seiten++;
        NT.saetzeAus(r.daten).forEach(function (s) { var k = s._art + '|' + (s.id || JSON.stringify(s)); if (gesehen[k]) return; gesehen[k] = 1; alle.push(s); });
        token = r.daten ? r.daten.next_page_token : null;
      } while (token && seiten < SEITEN_DECKEL);
      if (token) { sag('Abbruch: Seitendeckel erreicht - nichts geschrieben'); return { ok: false, ausgabe: log.join('\n'), zaehler: Z }; }
    }
  }
  /* je Kuerzel eine Datei (Zuordnung wie im Nachtrag: jedes Kuerzel, das der Satz in einem Symbolfeld nennt) */
  var jeSym = {}; alle.forEach(function (s) { NT.symboleAus(s).forEach(function (x) { (jeSym[x] = jeSym[x] || []).push(s); }); });
  var namen = {}, doppelt = [];
  Object.keys(jeSym).forEach(function (x) { var k = ON(x).toUpperCase(); if (namen[k]) doppelt.push(namen[k] + '/' + x); else namen[k] = x; });
  if (doppelt.length) { sag('Abbruch: Dateinamen nicht eindeutig (' + doppelt.join(', ') + ') - nichts geschrieben'); return { ok: false, ausgabe: log.join('\n') }; }
  var tmp = ziel + '.tmp'; if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  var stand = new Date().toISOString(), jeArt = {};
  alle.forEach(function (s) { jeArt[s._art] = (jeArt[s._art] || 0) + 1; });
  Object.keys(jeSym).sort().forEach(function (x) {
    atomar(path.join(tmp, ON(x) + '.json'), JSON.stringify({ sym: x, stand: stand, quelle: 'alpaca v1 corporate-actions', von: opt.von, bis: opt.bis,
      abrufart: 'Nachtrag fuer die lebenden Panel-Reihen (symbols=, Bloecke zu ' + block + '), tools/panel-fortschreiben-massnahmen.js', saetze: jeSym[x] }));
  });
  atomar(path.join(tmp, '_nachtrag.json'), JSON.stringify({ stand: stand, quelle: 'alpaca v1 corporate-actions', werkzeug: 'tools/panel-fortschreiben-massnahmen.js', von: opt.von, bis: opt.bis,
    gefragteKuerzel: symbole.length, abrufe: Z.abrufe, wiederholt: Z.wiederholt, fehler: Z.fehler, saetze: alle.length, saetzeJeArt: jeArt, dateien: Object.keys(jeSym).length,
    dauerSekunden: Math.round((Date.now() - beginn) / 1000), symbole: symbole }, null, 1));
  fs.renameSync(tmp, ziel);
  sag('Nachtrag: ' + Z.abrufe + ' Abrufe, ' + alle.length + ' Saetze, ' + Object.keys(jeSym).length + ' Dateien -> ' + ziel + ' | je Art ' + JSON.stringify(jeArt));
  return { ok: true, ausgabe: log.join('\n'), zaehler: Z, saetze: alle.length };
}

/* ---------- Aufruf ---------- */
function arg(n) { var i = process.argv.indexOf('--' + n); return i === -1 ? null : process.argv[i + 1]; }
/** Die Massstab-Symbole aus der Konfiguration des Werkzeugs (nicht im Code). */
function massstabSymbole() {
  var k = JSON.parse(fs.readFileSync(path.join(__dirname, 'panel-fortschreiben-massnahmen.konfig.json'), 'utf8'));
  if (!Array.isArray(k.massstabSymbole) || !k.massstabSymbole.length) throw new Error('panel-fortschreiben-massnahmen.konfig.json: massstabSymbole fehlt');
  return k.massstabSymbole.map(String);
}
/** Die Kuerzel eines Laufs: lebende Panel-Reihen plus Massstab-Symbole (ohne Doppel); nurMassstab -> nur die Massstab-Symbole. */
function kuerzelDesLaufs(lebende, massstab, nurMassstab) {
  var aus = nurMassstab ? [] : lebende.slice();
  massstab.forEach(function (x) { if (aus.indexOf(x) === -1) aus.push(x); });
  return aus;
}
async function haupt() {
  var S = require(path.join(REPO, 'studien', 'vorregistrierung-2026-09-02-spannen-historisch', 'schluessel.js'));
  var V = require(path.join(REPO, 'tools', 'alpaca-vollsammlung.js'));
  var F = require('./panel-fortschreiben.js');
  var K = require(path.join(REPO, 'studien', 'querschnitt-pruefstand-2026-09-13', 'konfig.js'));
  if (!S.vorhanden()) { console.log('Kein Zugang in der Umgebung (es fehlt: ' + S.fehlend().join(', ') + ') - ueber tools\\panel-fortschreiben.cmd starten.'); return 2; }
  var nurMassstab = process.argv.indexOf('--nur-massstab') !== -1, MS = massstabSymbole(), heute0 = new Date().toISOString().slice(0, 10);
  if (nurMassstab) {
    if (!arg('von')) { console.log('--nur-massstab braucht --von YYYY-MM-DD'); return 2; }
    var Wm = K.archivWurzel();
    var Rm = await holen({ wurzel: Wm, symbole: kuerzelDesLaufs([], MS, true), von: arg('von'), bis: arg('bis') || plusTage(heute0, NACH_TAGE),
      ordnerName: 'alpaca-massnahmen-nachtrag-massstab-' + heute0.slice(0, 7), rate: V.RATE_JE_MIN, ordnerNameFn: V.ordnerName, kopfzeilen: S.kopfzeilen, verdecken: S.verdecken });
    return Rm.ok ? 0 : 1;
  }
  var PS = path.join(REPO, 'studien', 'querschnitt-pruefstand-2026-09-13');
  var stamm = arg('stamm') ? path.resolve(PS, arg('stamm')) : F.stammOrdnerWahl(PS);
  var st = JSON.parse(fs.readFileSync(path.join(stamm, 'panel', '_stand.json'), 'utf8'));
  var wurzel = K.archivWurzel(), man = JSON.parse(fs.readFileSync(path.join(wurzel, 'alpaca1m', '_manifest.json'), 'utf8')).eintraege, sym = {};
  Object.keys(man).forEach(function (k) { if (man[k].sym) sym[k.split('/')[0]] = man[k].sym; });
  var symbole = []; st.symbole.forEach(function (s) { if (s.lebend !== 1) return; var x = sym[s.ordner] || String(s.ordner).replace(/~\d+$/, ''); if (symbole.indexOf(x) === -1) symbole.push(x); });
  symbole = kuerzelDesLaufs(symbole, MS, false);   // Nr. 126: die Massstab-Symbole (QQQ, SPY) laufen jeden Monat mit
  var heute = new Date().toISOString().slice(0, 10);
  var R = await holen({ wurzel: wurzel, symbole: symbole, von: plusTage(st.letzterVollTag, -VOR_TAGE), bis: arg('bis') || plusTage(heute, NACH_TAGE),
    ordnerName: 'alpaca-massnahmen-nachtrag-' + heute.slice(0, 7), rate: V.RATE_JE_MIN, ordnerNameFn: V.ordnerName, kopfzeilen: S.kopfzeilen, verdecken: S.verdecken });
  return R.ok ? 0 : 1;
}
if (require.main === module) haupt().then(function (rc) { process.exit(rc); }, function (e) {
  var S = require(path.join(REPO, 'studien', 'vorregistrierung-2026-09-02-spannen-historisch', 'schluessel.js'));
  console.log('FEHLER: ' + S.verdecken(String(e && e.message || e))); process.exit(1);
});
module.exports = { holen: holen, BLOCK: BLOCK, massstabSymbole: massstabSymbole, kuerzelDesLaufs: kuerzelDesLaufs };
