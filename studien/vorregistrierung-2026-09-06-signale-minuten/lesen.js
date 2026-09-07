'use strict';
/* LESEN - eine Symbol-Jahr-Datei des Alpaca-Minutenarchivs in einem Stueck (VORREGISTRIERUNG §11).
 *
 * Nur lesen. Keine Sperre, kein Netz, kein Schluessel. Bereinigt, wo es eine Kopie gibt,
 * sonst roh (alpaca1m-bereinigt/_regel.json: "fehlt sie, IST die Rohdatei die bereinigte").
 * Geliefert werden nur die REGULAEREN Kerzen (aus den `sitzungen`-Bereichen der Datei, also
 * dem Kalender der Quelle mit Halbtagen), geschnitten auf das Datenfenster und auf die
 * Lebenszeit der Reihe (~2-Reihen, wiederverwendete Kuerzel).
 *
 * Die Pfade kommen NICHT aus alpacaarchiv.js: an dieser Datei baut parallel ein anderer
 * Chat, und ein require auf eine halbfertige Datei risse den Nachtlauf. Ordnername je
 * Kuerzel aus _symbole.json (`ordner`), Rueckfall = das Kuerzel selbst.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var KC = require(path.join(K.REPO, 'markt', 'kerzenchart.js'));
/* Wertpapierart (Nachtrag 1, F1 der Pruefung): nur CS und ADRC sind Aktien. Die Gruppe 'universum'
 * des Archivs traegt 732 Nicht-Aktien (666 ETFs); die Huerde ist an Aktien gemessen. Karte aus
 * Markt-Dashboard-Daten/massive/wertpapierarten.json ueber das Modul der Messmaschine. */
var WA = require(path.join(K.REPO, 'studien', 'messmaschine', 'strategien', 'wertpapierart.js'));

/* ---------- ET-Zeit ---------- */
var ET_STUNDE = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false });
var versatzMerk = {};
/** Stunden zwischen UTC und New York fuer den UTC-Tag dieses Stempels (4 oder 5). */
function etVersatzStunden(ms) {
  var tag = Math.floor(ms / 86400000);
  if (versatzMerk[tag] !== undefined) return versatzMerk[tag];
  var d = new Date(ms);
  var etH = (+ET_STUNDE.formatToParts(d).filter(function (p) { return p.type === 'hour'; })[0].value) % 24;
  var v = d.getUTCHours() - etH; if (v < 0) v += 24;
  return (versatzMerk[tag] = v);
}
/** Kalendertag einer REGULAEREN Kerze: 09:30-16:00 ET liegt immer am selben UTC-Tag
 *  (13:30-21:00 UTC). Dieselbe Regel wie tagVon() in der Detektortabelle. */
function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }
/** UTC-Stempel des Sitzungsschlusses (Kalender der Quelle, Halbtage 13:00) an diesem Tag. */
function schlussMs(tagEt, ersteKerzeMs) {
  var kal = K.kalender();
  var e = kal.close[tagEt];
  var c = (e && e.close ? e.close : '16:00').split(':').map(Number);
  var p = tagEt.split('-').map(Number);
  return Date.UTC(p[0], p[1] - 1, p[2], c[0] + etVersatzStunden(ersteKerzeMs), c[1]);
}
function etTagMs(tagEt) { var p = tagEt.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); }

/* ---------- Reihen ---------- */
var META = null;
function meta() {
  if (META) return META;
  var roh = K.ORTE.roh();
  var lz = JSON.parse(fs.readFileSync(path.join(roh, '_lebenszeit.json'), 'utf8')).werte || {};
  var sy = JSON.parse(fs.readFileSync(path.join(roh, '_symbole.json'), 'utf8'));
  META = { lebenszeit: lz, ordner: sy.ordner || {}, gruppe: sy.gruppe || {} };
  return META;
}
function ordnerFuer(reihe) { return meta().ordner[reihe] || reihe; }
/** Alle Reihen der Studie: mit Balken, nur Aktien (CS/ADRC), ~2-Reihen eigenstaendig. Sortiert.
 *  Die Nicht-Aktien stehen gezaehlt in reihen.ausgeschlossen (je Wertpapierart). */
var REIHEN = null;
function reihen() {
  if (REIHEN) return REIHEN;
  if (!WA.klassifizierungDa()) throw new Error('Wertpapier-Klassifizierung fehlt (Markt-Dashboard-Daten/massive/wertpapierarten.json) - das Universum waere ungefiltert. Abbruch.');
  var arten = {};
  try { arten = JSON.parse(fs.readFileSync(path.join(require('os').homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive', 'wertpapierarten.json'), 'utf8')).arten || {}; } catch (e) { arten = {}; }
  var m = meta(), lebendAb = etTagMs(K.LEBEND_AB), aus = [], weg = {};
  Object.keys(m.lebenszeit).forEach(function (r) {
    var e = m.lebenszeit[r];
    if (!e || !(e.balken > 0) || !e.letzter) return;
    var basis = r.replace(/~2$/, '');
    if (!WA.istAktie(basis)) { var art = arten[basis] || arten[basis.replace(/-/g, '.')] || (WA.TESTKUERZEL[basis] ? 'TEST' : 'ohne Art'); weg[art] = (weg[art] || 0) + 1; return; }
    /* lebend = letzter Balken der REIHE im Fenster; ein erloschener Traeger eines wiederverwendeten
     * Kuerzels ist nie lebend, auch wenn das Kuerzel heute wieder Balken hat (F12 der Pruefung). */
    var erloschen = !!(e.wiederverwendet && e.wiederverwendet.schnitt);
    var R = { reihe: r, ordner: ordnerFuer(r), lebend: (!erloschen && e.letzter >= lebendAb) ? 1 : 0, jahre: (e.jahre || []).slice().sort(),
      gruppe: m.gruppe[basis] || 'unbekannt', art: arten[basis] || arten[basis.replace(/-/g, '.')] || null, schnittMs: null, abMs: null };
    if (erloschen) R.schnittMs = e.wiederverwendet.schnitt;                                        // erloschener Traeger: nur bis hier
    if (e.zweiteReihe && e.zweiteReihe.abMs) R.abMs = e.zweiteReihe.abMs;                          // ~2: erst ab hier
    aus.push(R);
  });
  aus.sort(function (a, b) { return a.reihe < b.reihe ? -1 : a.reihe > b.reihe ? 1 : 0; });
  aus.ausgeschlossen = weg;
  REIHEN = aus;
  return aus;
}

/* ---------- Kapitalmassnahmen (§8) ---------- */
var UNKLAR = null;
/** Abspaltungen, deren Kursfaktor unklar blieb: Menge "SYM|YYYY-MM-DD". */
function unklareAbspaltungen() {
  if (UNKLAR) return UNKLAR;
  UNKLAR = new Set();
  try {
    var j = JSON.parse(fs.readFileSync(path.join(K.ORTE.massnahmen(), '_abspaltungsfaktoren.json'), 'utf8'));
    (j.ergebnisse || []).forEach(function (e) { if (e.urteil !== 'gemessen') UNKLAR.add(e.sym + '|' + e.datum); });
  } catch (e) { UNKLAR.fehler = e.message; }
  return UNKLAR;
}
/** Massnahmen mit Kurswirkung dieser Reihe: [{art, ex}] aus alpaca-massnahmen/<ORDNER>.json. */
function massnahmenFuer(R) {
  var p = path.join(K.ORTE.massnahmen(), R.ordner.replace(/~2$/, '') + '.json');
  var aus = []; aus.ende = null;
  try {
    var j = JSON.parse(fs.readFileSync(p, 'utf8'));
    (j.saetze || []).forEach(function (s) {
      var ex = s.ex_date || s.process_date || s.effective_date; if (!ex) return;
      /* Ende-Art (F10 der Pruefung): 'verschwunden' heisst nicht 'gestorben' - Namenswechsel und
       * Fusionen stehen hier; die juengste wird je Reihe nachrichtlich mitgefuehrt. */
      if (K.ENDE_ARTEN.indexOf(s._art) !== -1 && (!aus.ende || ex > aus.ende.ex)) aus.ende = { art: s._art, ex: ex };
      if (K.MASSNAHMEN_ARTEN.indexOf(s._art) === -1) return;
      aus.push({ art: s._art, ex: ex });
    });
  } catch (e) { /* keine Datei = keine Massnahme bekannt; wird im Lauf gezaehlt */ aus.fehlt = true; }
  return aus;
}
/** ET-Tage, die fuer diese Datei ausgeschlossen sind (+- MASSNAHMEN_FENSTER_TAGE um den Ex-Tag).
 *  roh gelesen: alle Massnahmen; bereinigt gelesen: nur die dort nicht angewandten. */
function ausschlussTage(R, massnahmen, quelle, angewandt) {
  var kal = K.kalender(), aus = new Set(), unklar = unklareAbspaltungen();
  var basis = R.reihe.replace(/~2$/, '');
  massnahmen.forEach(function (m) {
    var greift = quelle === 'roh' || !angewandt.has(m.art + '|' + m.ex) || (m.art === 'spin_offs' && unklar.has(basis + '|' + m.ex));
    if (!greift) return;
    var i = kal.idx[m.ex];
    if (i === undefined) { for (var q = 0; q < kal.tage.length; q++) if (kal.tage[q] > m.ex) { i = q; break; } }
    if (i === undefined) return;
    for (var d = Math.max(0, i - K.MASSNAHMEN_FENSTER_TAGE); d <= Math.min(kal.tage.length - 1, i + K.MASSNAHMEN_FENSTER_TAGE); d++) aus.add(kal.tage[d]);
  });
  return aus;
}

/* ---------- Eine Jahresdatei ---------- */
function dateiPfad(R, jahr) {
  var b = path.join(K.ORTE.bereinigt(), R.ordner, jahr + '.json');
  if (fs.existsSync(b)) return { pfad: b, quelle: 'bereinigt' };
  return { pfad: path.join(K.ORTE.roh(), R.ordner, jahr + '.json'), quelle: 'roh' };
}
function schlafe(ms) { var t = Date.now(); while (Date.now() - t < ms) { /* warten - der Anhang der App ist gleich fertig */ } }
/** Liest die Datei ganz; einmal nach 5 s wiederholen, dann {ok:false, grund}. Nie raten. */
function leseJson(pfad) {
  for (var versuch = 0; versuch < 2; versuch++) {
    try { var text = fs.readFileSync(pfad, 'utf8'); return { ok: true, json: JSON.parse(text), bytes: text.length }; }
    catch (e) { if (versuch === 0) schlafe(5000); else return { ok: false, grund: e.message }; }
  }
}
/** Regulaere Kerzen dieses Symbol-Jahres im Datenfenster, aufsteigend, ohne Doppelstempel.
 *  Rueckgabe { ok, kerzen, quelle, angewandt (Set art|ex), bytes, kerzenGesamt } oder { ok:false, grund }. */
function ladeJahr(R, jahr) {
  var d = dateiPfad(R, jahr);
  if (!fs.existsSync(d.pfad)) return { ok: false, grund: 'Datei fehlt', pfad: d.pfad, quelle: d.quelle };
  var g = leseJson(d.pfad);
  if (!g.ok) return { ok: false, grund: g.grund, pfad: d.pfad, quelle: d.quelle };
  var j = g.json, serie = j.series || [];
  if (!Array.isArray(serie)) return { ok: false, grund: 'series fehlt', pfad: d.pfad, quelle: d.quelle };
  /* Fenster in UTC-Stempeln: ET-Mitternacht des ersten Tages bis ET-Ende des letzten Tages -
   * fuer regulaere Kerzen reicht der UTC-Tag als Grenze (siehe tagVon). */
  var vonMs = etTagMs(K.FENSTER.von), bisMs = etTagMs(K.FENSTER.bis) + 86400000 - 1;
  var reg = (j.sitzungen || []).filter(function (b) { return b.sitzung === 'regulaer'; });
  var aus = [], bi = 0, letzt = -1;
  for (var i = 0; i < serie.length; i++) {
    var k = serie[i], t = k[0];
    if (!(t > letzt)) continue;                                   // Reihenfolge und Doppelstempel: nur aufsteigend
    if (t < vonMs || t > bisMs) continue;
    if (R.schnittMs != null && t > R.schnittMs) continue;
    if (R.abMs != null && t < R.abMs) continue;
    while (bi < reg.length && reg[bi].bis < t) bi++;
    if (bi >= reg.length || t < reg[bi].von) continue;             // nicht regulaer
    if (!(k[1] > 0) || !(k[5] > 0)) continue;                      // Schluss und Eroeffnung muessen Kurse sein
    aus.push(k); letzt = t;
  }
  var angewandt = new Set();
  var mm = j.massnahmen;
  if (Array.isArray(mm)) mm.forEach(function (m) { var ex = m.ex_date || m.ex || m.datum; if (m._art && ex) angewandt.add(m._art + '|' + ex); else if (m.art && ex) angewandt.add(m.art + '|' + ex); });
  else if (mm && typeof mm === 'object') Object.keys(mm).forEach(function (kk) { var m = mm[kk]; var ex = (m && (m.ex_date || m.ex || m.datum)) || kk; var art = (m && (m._art || m.art)) || ''; if (ex) angewandt.add(art + '|' + ex); });
  return { ok: true, kerzen: aus, quelle: d.quelle, pfad: d.pfad, angewandt: angewandt, bytes: g.bytes, kerzenGesamt: serie.length, massnahmenKopf: mm == null ? null : mm };
}

/* ---------- Tage und Verdichtung ---------- */
/** Tagesabschnitte einer aufsteigenden Kerzenreihe: [{tag, von, bis, schluss, auf, sollMin}]
 *  (Indizes einschliesslich; auf = 09:30 ET, schluss = Kalenderschluss, sollMin = Sitzungsminuten). */
function tageAus(kerzen) {
  var aus = [], s = 0, kal = K.kalender();
  for (var i = 1; i <= kerzen.length; i++) {
    if (i === kerzen.length || tagVon(kerzen[i][0]) !== tagVon(kerzen[s][0])) {
      var tag = tagVon(kerzen[s][0]), schluss = schlussMs(tag, kerzen[s][0]);
      var e = kal.close[tag], c = (e && e.close ? e.close : '16:00').split(':').map(Number), o = (e && e.open ? e.open : '09:30').split(':').map(Number);
      var sollMin = (c[0] * 60 + c[1]) - (o[0] * 60 + o[1]);
      aus.push({ tag: tag, von: s, bis: i - 1, schluss: schluss, auf: schluss - sollMin * 60000, sollMin: sollMin });
      s = i;
    }
  }
  return aus;
}
/** 5m/15m aus regulaeren 1m-Kerzen - die Funktion des Viewers, Gitter je Sitzung (Anker 09:30). */
function verdichte(kerzen1m, zrKey) {
  if (zrKey === '1m') return kerzen1m;
  var sitz = new Array(kerzen1m.length); for (var i = 0; i < sitz.length; i++) sitz[i] = 'regulaer';
  return KC.verdichtenMinuten(kerzen1m, zrKey, sitz).kerzen;
}

module.exports = { meta: meta, reihen: reihen, ordnerFuer: ordnerFuer, ladeJahr: ladeJahr, dateiPfad: dateiPfad, tageAus: tageAus, verdichte: verdichte,
  massnahmenFuer: massnahmenFuer, ausschlussTage: ausschlussTage, unklareAbspaltungen: unklareAbspaltungen,
  tagVon: tagVon, schlussMs: schlussMs, etVersatzStunden: etVersatzStunden, etTagMs: etTagMs };
