'use strict';
/* LESEN fuer die Panel-Tafel - eine Symbol-Jahr-Datei des Alpaca-Minutenarchivs (VORREGISTRIERUNG §1).
 *
 * HERKUNFT: eng an studien/vorregistrierung-2026-09-06-signale-minuten/lesen.js (dort abgenommen). Von dort
 * per require UNVERAENDERT uebernommen: meta(), reihen(), ordnerFuer(), massnahmenFuer(), unklareAbspaltungen(),
 * rohFaktorFunktion(), etTagMs(), tagVon(), etVersatzStunden().
 *
 * DREI Unterschiede, jeder mit Grund - test.js prueft sie einzeln:
 *   (1) Eigenes Datenfenster (2016 bis heute statt bis 2026-08-31): das Panel soll bis zum letzten
 *       vollstaendigen Handelstag reichen.
 *   (2) Die SCHLUSSAUKTIONSKERZE. Die regulaere Sitzung des Archivs endet mit der 15:59-Kerze; die Kerze mit
 *       dem ET-Stempel des Kalenderschlusses (16:00, Halbtag 13:00) liegt im Sitzungseimer "nach". Ihre
 *       EROEFFNUNG ist der Druck der Schlussauktion und damit der Tagesschluss (§1.3). lesen.js dort braucht
 *       sie nicht und filtert sie weg; hier wird sie gebraucht.
 *   (3) Geliefert werden Tageszeilen, keine Kerzenlisten - eine Jahresdatei wird einmal gelesen und
 *       verdichtet, nicht im Speicher gehalten.
 *
 * NUR LESEN. Keine Sperre, kein Netz, kein Schluessel. Alles Simulation mit virtuellem Kapital.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var L = require(path.join(K.MINUTEN, 'lesen.js'));

var ET_UHR = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false });
function etUhr(ms) { return ET_UHR.format(new Date(ms)); }
/** Kalendertag einer Kerze zwischen 04:00 und 20:00 ET: derselbe UTC-Tag (wie tagVon() dort). */
var tagVon = L.tagVon;

/* ---------- Dateiwahl und Lesen (Leseregel des Archivs) ---------- */
function dateiPfad(R, jahr) {
  var b = path.join(K.ORTE.bereinigt(), R.ordner, jahr + '.json');
  if (fs.existsSync(b)) return { pfad: b, quelle: 'bereinigt' };
  return { pfad: path.join(K.ORTE.roh(), R.ordner, jahr + '.json'), quelle: 'roh' };
}
function schlafe(ms) { var t = Date.now(); while (Date.now() - t < ms) { /* der Anhang der App ist gleich fertig */ } }
function leseJson(pfad) {
  for (var versuch = 0; versuch < 2; versuch++) {
    try { var text = fs.readFileSync(pfad, 'utf8'); return { ok: true, json: JSON.parse(text), bytes: text.length }; }
    catch (e) { if (versuch === 0) schlafe(4000); else return { ok: false, grund: e.message }; }
  }
}

/* ---------- Eine Symbol-Jahr-Datei zu Tageszeilen verdichten ---------- */
/**
 * Ergebnis: { ok, tage: [ {tag, dateiSchluss, dateiEroeffnung, faktor, umsatzReg, umsatzAuktion, kerzen,
 *   schlussErsatz, eroeffnungErsatz, dichteOk, stempelTag} ], quelleRein, angewandt, zaehler }
 *
 * ACHTUNG, DIE STELLE, AN DER DIE STUDIE SCHON EINMAL FALSCH GERECHNET HAT:
 * `dateiSchluss`/`dateiEroeffnung` stehen in DER SKALA DER DATEI - das ist die BEREINIGTE Skala, wo es eine
 * Kopie gibt (COKE 2016: 18,04 statt 180,40 $). Der ROHE Kurs ist `dateiKurs * faktor`, die BEREINIGTE Reihe
 * ist `dateiKurs` selbst (ueber alle Jahre stetig, weil jede Jahresdatei auf die heutige Skala bereinigt ist).
 * Wer hier `dateiKurs / faktor` rechnet, bekommt am Ex-Tag einen Kurssprung, der keiner ist.
 * Umsatz in $ ist gegen die Bereinigung invariant (Kurs geteilt, Stueck malgenommen) - deshalb ohne Faktor.
 */
function ladeJahr(R, jahr, kal) {
  var d = dateiPfad(R, jahr);
  if (!fs.existsSync(d.pfad)) return { ok: false, grund: 'Datei fehlt', pfad: d.pfad };
  var g = leseJson(d.pfad);
  if (!g.ok) return { ok: false, grund: g.grund, pfad: d.pfad };
  var j = g.json, serie = j.series || [];
  if (!Array.isArray(serie)) return { ok: false, grund: 'series fehlt', pfad: d.pfad };

  /* Quelle je Datei (§1.8): alle `quellen`-Bereiche muessen 'alpaca' sein. */
  var quelleRein = true, quellen = j.quellen || [];
  for (var qi = 0; qi < quellen.length; qi++) if (String(quellen[qi].quelle || '').toLowerCase() !== 'alpaca') quelleRein = false;
  if (!quellen.length && String(j.quelle || '').indexOf('alpaca') === -1) quelleRein = false;

  /* Massnahmen im Kopf: angewandte Bereinigungen und Rueckrechnungsfaktoren (wie dort). */
  var angewandt = new Set(), rueck = [];
  var mm = j.massnahmen;
  if (Array.isArray(mm)) mm.forEach(function (m) {
    var ex = m.ex_date || m.ex || m.datum; if (!ex) return;
    if (m._art) angewandt.add(m._art + '|' + ex); else if (m.art) angewandt.add(m.art + '|' + ex);
    if (m.faktor > 0) rueck.push({ exMs: L.etTagMs(ex), faktor: m.faktor });
  });
  else if (mm && typeof mm === 'object') Object.keys(mm).forEach(function (kk) {
    var m = mm[kk]; var ex = (m && (m.ex_date || m.ex || m.datum)) || kk; var art = (m && (m._art || m.art)) || '';
    if (ex) angewandt.add(art + '|' + ex);
  });
  rueck.sort(function (a, b) { return a.exMs - b.exMs; });
  var rohFaktor = L.rohFaktorFunktion(rueck);

  /* Sitzungsbereiche, aufsteigend. Wir brauchen 'regulaer' fuer Umsatz/Kerzen und ALLE Kerzen fuer die
   * Schlussauktion - deshalb wird nicht vorab gefiltert. */
  var sitz = (j.sitzungen || []).slice().sort(function (a, b) { return a.von - b.von; });
  var vonMs = L.etTagMs(K.FENSTER_VON), bisMs = L.etTagMs(K.FENSTER_BIS_MAX) + 86400000 - 1;

  var tage = [], akt = null, si = 0, letzt = -1;
  var z = { unsortiert: 0, ausserFenster: 0, lebenszeit: 0, ohneKurs: 0, kerzenGesehen: 0, stempelkerzen: 0 };

  function schliesse() {
    if (!akt) return;
    if (akt.kerzen > 0) {
      /* Tagesschluss (§1.3) */
      if (akt.auktionKerze) { akt.dateiSchluss = akt.auktionKerze[5]; akt.schlussErsatz = 0; }
      else { akt.dateiSchluss = akt.letzteReg[1]; akt.schlussErsatz = 1; }
      akt.dateiEroeffnung = akt.ersteReg[5];
      var e = kal.close[akt.tag], o = (e && e.open ? e.open : '09:30');
      akt.eroeffnungErsatz = (etUhr(akt.ersteReg[0]) === o || etUhr(akt.ersteReg[0]) === o.replace(/^0/, '')) ? 0 : 1;
      var c = (e && e.close ? e.close : '16:00').split(':').map(Number), op = o.split(':').map(Number);
      var sollMin = (c[0] * 60 + c[1]) - (op[0] * 60 + op[1]);
      akt.sollMin = sollMin;
      akt.dichteOk = (akt.kerzen >= K.DICHTE_MIN * sollMin) ? 1 : 0;
      akt.stempelTag = (akt.stempelKerzen === akt.kerzen) ? 1 : 0;
      akt.faktor = rohFaktor(akt.ersteReg[0]);
      delete akt.ersteReg; delete akt.letzteReg; delete akt.auktionKerze;
      tage.push(akt);
    }
    akt = null;
  }

  for (var i = 0; i < serie.length; i++) {
    var k = serie[i], t = k[0];
    z.kerzenGesehen++;
    if (!(t > letzt)) { z.unsortiert++; continue; }
    if (t < vonMs || t > bisMs) { z.ausserFenster++; continue; }
    if ((R.schnittMs != null && t > R.schnittMs) || (R.abMs != null && t < R.abMs)) { z.lebenszeit++; continue; }
    letzt = t;
    if (!(k[1] > 0) || !(k[5] > 0)) { z.ohneKurs++; continue; }
    var tg = tagVon(t);
    if (!kal.close[tg]) continue;                                   // kein Handelstag der Quelle
    if (!akt || akt.tag !== tg) { schliesse(); akt = { tag: tg, kerzen: 0, umsatzReg: 0, umsatzAuktion: 0, stempelKerzen: 0, ersteReg: null, letzteReg: null, auktionKerze: null }; }
    /* Sitzungseimer dieser Kerze */
    while (si < sitz.length && sitz[si].bis < t) si++;
    var typ = (si < sitz.length && t >= sitz[si].von) ? sitz[si].sitzung : 'keine';
    var soll = (kal.close[tg] && kal.close[tg].close) || '16:00';
    var u = etUhr(t);
    if (typ === 'regulaer') {
      akt.kerzen++;
      akt.umsatzReg += k[1] * k[2];                                 /* Kurs x Stueck; gegen Bereinigung invariant */
      if (!akt.ersteReg) akt.ersteReg = k;
      akt.letzteReg = k;
      if (K.istStempelkerze(k)) { akt.stempelKerzen++; z.stempelkerzen++; }
    }
    if (u === soll || u === soll.replace(/^0/, '')) { akt.auktionKerze = k; akt.umsatzAuktion += k[1] * k[2]; }
  }
  schliesse();
  return { ok: true, tage: tage, quelleRein: quelleRein, angewandt: angewandt, zaehler: z, pfad: d.pfad, quelle: d.quelle, bytes: g.bytes };
}

module.exports = {
  reihen: L.reihen, meta: L.meta, ordnerFuer: L.ordnerFuer, massnahmenFuer: L.massnahmenFuer,
  ausschlussTage: L.ausschlussTage, unklareAbspaltungen: L.unklareAbspaltungen,
  etTagMs: L.etTagMs, tagVon: tagVon, etUhr: etUhr, dateiPfad: dateiPfad, ladeJahr: ladeJahr, leseJson: leseJson,
};
