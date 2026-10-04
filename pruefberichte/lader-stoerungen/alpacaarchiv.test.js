'use strict';
/* Pruefbericht "Lader-Stoerungen" (Oktober 2026): Kleinsttests fuer alpacaarchiv.js (Praefix AA).
 *
 * LADER: alpacaarchiv.js - die EINE Schreibroutine des Alpaca-Minutenarchivs alpaca1m/<ORDNER>/<JAHR>.json
 * (jahrSchreiben: neue Datei atomar, Anhang an Ort und Stelle mit Reparaturjournal), dazu Annehmer
 * (kerzeAus), Ordnerabbildung, Lebenszeit, Jahresgrenzen (ET) und Sitzungsbereiche je Kerze.
 * Stand 61dca2c. Bericht: pruefberichte/lader-stoerungen/alpacaarchiv.md.
 *
 * STOERUNGEN: S1 leere Antwort, S2 unfertige Kerze/Raster, S3 Jahresgrenze ET, S4 Kuerzel->Ordner und
 * Neuvergabe, S5 Lebenszeit/Zwilling, S7 flache Kerzen ohne Umsatz, S8 Zeitumstellung, S9 Feiertag/
 * Kalender deckt nicht, S10 Halbtag, S11 Kursaussetzung, dazu Anhang aelter/doppelt/unsortiert,
 * Hoch < Tief, Absturz im Anhang (Journal), abgeschnittene Datei, Kopf-Feld anderer Laenge.
 * S6 (bereinigt/roh) und S12 (Massnahme ohne Kurs) stehen nicht in dieser Datei - siehe Bericht.
 *
 * Alles nachgebaut: keine Abrufe, keine Kursdaten von der Platte. Geschrieben wird nur unter
 * H.tempOrdner (MD_ALPACA_WURZEL je Test). Feste Uhr ueber H.mitUhr - nie die echte.
 *
 * Aufruf aus der Repo-Wurzel:  node pruefberichte/lader-stoerungen/alpacaarchiv.test.js
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var H = require('./hilfen.js');
var A = H.lade('alpacaarchiv.js');
var fs = require('fs');
var path = require('path');

var DATEI = 'alpacaarchiv.js';
/* Feste Uhr: Montag 2026-10-05 12:00 ET (EDT). */
var JETZT = Date.UTC(2026, 9, 5, 16, 0, 0);

/* ---------------- lokale Hilfen ---------------- */
function zl(anker) { return DATEI + ':' + H.zeileVon(DATEI, anker); }
/** Eine Kerze [t, schluss, umsatz, hoch, tief, eroeffnung] aus einer UTC-ISO-Zeit. */
function K(iso, c, v, h, l, o) { return [Date.parse(iso), c, v == null ? 100 : v, h == null ? c : h, l == null ? c : l, o == null ? c : o]; }
/** Ein Alpaca-Balken wie in {"bars":{"SYM":[...]}}. */
function balken(iso, o, h, l, c, v) { var b = { t: iso, o: o, h: h, l: l, c: c, n: 3, vw: c }; if (v !== undefined) b.v = v; return b; }
/** Kalender der Quelle { 'YYYY-MM-DD': {open, close} }. */
function kal(tage, close) { var k = {}; tage.forEach(function (t) { k[t] = { open: '09:30', close: close || '16:00' }; }); return k; }
function lies(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
/** Je Test eine eigene Archiv-Wurzel im Wegwerf-Ordner; synchron; feste Uhr; danach zurueck. */
function mitWurzel(name, fn, jetzt) {
  var w = H.tempOrdner('aa-' + name);
  var alt = process.env.MD_ALPACA_WURZEL;
  process.env.MD_ALPACA_WURZEL = w;
  try {
    var roh = A.rohOrdner();
    if (!H.imTmp(roh) || !H.imTmp(A.bereinigtOrdner())) throw new Error('Rohordner nicht im Wegwerf-Ordner: ' + roh);
    return H.mitUhr(jetzt || JETZT, function () { return fn(roh); });
  } finally { process.env.MD_ALPACA_WURZEL = alt; }
}
function metaSchreiben(roh, was, obj) {
  fs.mkdirSync(roh, { recursive: true });
  var p = A.metaPfad(roh, was);
  if (!H.imTmp(p)) throw new Error('Meta-Pfad nicht im Wegwerf-Ordner: ' + p);
  fs.writeFileSync(p, typeof obj === 'string' ? obj : JSON.stringify(obj));
  return p;
}
/* Die dokumentierten Rueckgabefelder von jahrSchreiben (alpacaarchiv.js, Kommentar ueber jahrSchreiben).
 * Ein Hinweis (Bruch, Zwilling, Korrektur, verlorene Kerze) waere ein Feld DARUEBER HINAUS - verglichen
 * wird gegen die feste Liste, nicht per Muster ueber die Feldnamen ('uebersprungen' enthaelt 'sprung'). */
var FELDER_JS = ['ok', 'geschrieben', 'art', 'neu', 'uebersprungen', 'letzterStempel', 'bytes', 'pfad', 'sitzungenZaehler', 'geschriebenBytes', 'ms'];
function zusatzFelder(w) { return Object.keys(w || {}).filter(function (x) { return FELDER_JS.indexOf(x) < 0; }); }
function ordnerVon(roh, sym) { var o = path.join(roh, A.ordnerName(sym)); if (!H.imTmp(o)) throw new Error('Ordner nicht im Wegwerf-Ordner'); return o; }
function fuenfMinuten(tagIso, hhmm, c0, schritt) {
  var t0 = Date.parse(tagIso + 'T' + hhmm + ':00Z'), aus = [];
  for (var i = 0; i < 5; i++) aus.push([t0 + i * 60000, c0 + i * (schritt || 0.01), 100 + i, c0 + i * (schritt || 0.01), c0 + i * (schritt || 0.01), c0 + i * (schritt || 0.01)]);
  return aus;
}

module.exports = {
  lader: 'alpacaarchiv.js',
  tests: [

    /* ------------------------------------------------------------------ S1 */
    { id: 'AA-1', stoerung: 'S1 HTTP 200 mit leerem Inhalt ({"bars":{}} / null)', bewertung: '-',
      lauf: async function (H) {
        return mitWurzel('s1', function (roh) {
          var KAL = kal(['2026-09-01']);
          /* Die Antwort {"bars":{}} oder {"bars":{"LEER":null}} ergibt im Annehmer keine Kerze. */
          var antworten = [{ bars: {} }, { bars: { LEER: null } }, null];
          var ausAntwort = antworten.map(function (r) { var b = r && r.bars ? r.bars.LEER : null; return (Array.isArray(b) ? b : []).map(A.kerzeAus).filter(Boolean); });
          var nullWirft = false; try { A.kerzeAus(null); A.kerzeAus(undefined); } catch (e) { nullWirft = true; }
          /* (a) neue Reihe, leerer Eingang */
          var oNeu = ordnerVon(roh, 'LEER');
          var r1 = A.jahrSchreiben(oNeu, 'LEER', 2026, ausAntwort[0], KAL, { herkunft: 'AA-1' });
          var neuDa = fs.existsSync(path.join(oNeu, '2026.json')) || fs.existsSync(oNeu);
          /* (b) vorhandene Datei, leerer Eingang: Bytes (auch stand und quellen.bis) muessen bleiben */
          var oAlt = ordnerVon(roh, 'VOLL');
          var r0 = A.jahrSchreiben(oAlt, 'VOLL', 2026, fuenfMinuten('2026-09-01', '13:30', 10).slice(0, 3), KAL, { herkunft: 'AA-1' });
          var p = path.join(oAlt, '2026.json');
          H.betreten(r0.ok && r0.geschrieben && fs.existsSync(p) && lies(p).series.length === 3, 'Bestandsdatei mit 3 Kerzen angelegt');
          var vorher = fs.readFileSync(p);
          var r2 = mitWurzelUhr(JETZT + 3600000, function () { return A.jahrSchreiben(oAlt, 'VOLL', 2026, ausAntwort[1], KAL); });
          var nachher = fs.readFileSync(p);
          var gleich = Buffer.compare(vorher, nachher) === 0;
          var abw = nullWirft || !r1.ok || r1.geschrieben || neuDa || !r2.ok || r2.geschrieben || !gleich || ausAntwort.some(function (a) { return a.length; });
          return { abweichung: abw,
            text: 'leere Antwort -> neue Reihe: geschrieben=' + r1.geschrieben + ', Datei/Ordner angelegt=' + neuDa + '; Bestandsdatei: geschrieben=' + r2.geschrieben +
              ', Bytes gleich (stand/quellen.bis unberuehrt)=' + gleich + '. Soll: keine leere Jahresdatei, kein fortgeschriebener Stand. ' + zl("if (!reihe.length) return { ok: true, geschrieben: false, art: 'neu'") };
        });
      } },

    /* ------------------------------------------------------------------ S2a */
    { id: 'AA-2', stoerung: 'S2 Stempel mit Sekunden/Millisekunden, Kurs 0/NaN (Annehmer kerzeAus)', bewertung: '-',
      lauf: async function (H) {
        return mitWurzel('s2a', function (roh) {
          var bars = [
            balken('2026-09-01T13:30:00Z', 10, 10.2, 9.9, 10.1, 500),     /* gut */
            balken('2026-09-01T13:31:30Z', 10, 10.2, 9.9, 10.1, 500),     /* Sekunden != 0 */
            balken('2026-09-01T13:32:00.500Z', 10, 10.2, 9.9, 10.1, 500), /* Millisekunden != 0 */
            balken('2026-09-01T13:33:00Z', 10, 10.2, 9.9, 0, 500),        /* Schluss 0 */
            balken('2026-09-01T13:34:00Z', NaN, 10.2, 9.9, 10.1, 500),    /* Eroeffnung NaN */
            balken('2026-09-01T13:35:00Z', 10, 10.2, 9.9, 10.05, 400)     /* gut */
          ];
          var k = bars.map(A.kerzeAus);
          var angenommen = k.filter(Boolean);
          var o = ordnerVon(roh, 'RAST');
          var w = A.jahrSchreiben(o, 'RAST', 2026, angenommen, kal(['2026-09-01']));
          var p = path.join(o, '2026.json');
          H.betreten(w.ok && fs.existsSync(p), 'Jahresdatei aus den angenommenen Kerzen geschrieben');
          var s = lies(p).series;
          var raster = s.every(function (x) { return x[0] % 60000 === 0; });
          /* Gegenprobe der Schreibroutine selbst: prueft sie das Raster, wenn ein Aufrufer am Annehmer vorbei schreibt? */
          var o2 = ordnerVon(roh, 'ROH2');
          var w2 = A.jahrSchreiben(o2, 'ROH2', 2026, [K('2026-09-01T13:30:30Z', 10)], kal(['2026-09-01']));
          var abw = !(k[0] && !k[1] && !k[2] && !k[3] && !k[4] && k[5]) || s.length !== 2 || !raster;
          return { abweichung: abw,
            text: 'Annehmer: ' + angenommen.length + ' von 6 Balken angenommen (Soll 2: Sekunden, ms, Kurs 0, NaN verworfen), Datei ' + s.length + ' Kerzen, alle auf der Minute=' + raster +
              '. Nebenbefund: jahrSchreiben selbst prueft das Raster nicht (direkt uebergeben: ok=' + w2.ok + ') ' + zl("if (!isFinite(t) || t % 60000 !== 0) return null;") + ' / ' + zl("function kerzenPruefen(kerzen, jahr) {") };
        });
      } },

    /* ------------------------------------------------------------------ S2b */
    { id: 'AA-3', stoerung: 'S2 unfertige Kerze (juenger als die fertig-Grenze) wird festgeschrieben, Korrektur still uebersprungen', bewertung: 'C',
      lauf: async function (H) {
        return mitWurzel('s2b', function (roh) {
          var KAL = kal(['2026-10-05']);
          var o = ordnerVon(roh, 'UNF');
          var p = path.join(o, '2026.json');
          /* Uhr 16:00Z (12:00 ET). fertig-Grenze Soll: jetzt - 16 min = 15:44Z (livesammler.js) bzw. - 30 min (Werkzeug). */
          var bestand = [K('2026-10-05T15:30:00Z', 99, 2000)];
          var unfertig = [K('2026-10-05T15:50:00Z', 100, 10, 100, 100, 100), K('2026-10-05T16:00:00Z', 100.5, 3, 100.5, 100.5, 100.5)];
          var r1 = A.jahrSchreiben(o, 'UNF', 2026, bestand.concat(unfertig), KAL);
          H.betreten(r1.ok && fs.existsSync(p) && lies(p).series.length === 3, 'Datei mit Bestand + 2 unfertigen Kerzen');
          var grenze = JETZT - 16 * 60000;
          var unfertigImArchiv = lies(p).series.filter(function (k) { return k[0] > grenze; }).length;
          /* 40 Minuten spaeter liefert die Quelle die fertigen Fassungen derselben Minuten */
          var fertig = [K('2026-10-05T15:50:00Z', 101, 900, 101.2, 99.8, 100), K('2026-10-05T16:00:00Z', 102, 800, 102.1, 100.4, 100.5), K('2026-10-05T16:10:00Z', 103, 700)];
          var r2 = mitWurzelUhr(JETZT + 40 * 60000, function () { return A.jahrSchreiben(o, 'UNF', 2026, fertig, KAL); });
          var s = lies(p).series;
          var k1550 = s.filter(function (k) { return k[0] === Date.parse('2026-10-05T15:50:00Z'); })[0];
          H.betreten(r2.ok && s.length === 4, 'zweiter Anhang betreten (16:10 angehaengt)');
          var bleibtFalsch = k1550 && k1550[1] === 100 && k1550[2] === 10;
          var meldet = zusatzFelder(r2).length > 0;
          var abw = unfertigImArchiv > 0 && bleibtFalsch && !meldet;
          return { abweichung: abw,
            text: 'jahrSchreiben nahm ' + unfertigImArchiv + ' Kerzen juenger als jetzt-16min an (Soll 0); die fertige Fassung von 15:50Z (Schluss 101, Umsatz 900) wurde still uebersprungen, ' +
              'Archiv behaelt Schluss ' + (k1550 && k1550[1]) + '/Umsatz ' + (k1550 && k1550[2]) + ' fuer immer; Rueckgabe nur uebersprungen=' + r2.uebersprungen + ' ohne Unterscheidung. ' +
              zl('var neu = b.leer ? reihe : reihe.filter(') + ' / ' + zl('function kerzenPruefen(kerzen, jahr) {') };
        });
      } },

    /* ------------------------------------------------------------------ S3 */
    { id: 'AA-4', stoerung: 'S3 Silvester-Nachboerse: 31.12. 19:00 ET = 01.01. 00:00 UTC', bewertung: '-',
      lauf: async function (H) {
        return mitWurzel('s3', function (roh) {
          var KAL = kal(['2025-12-31', '2026-01-02']);
          var k = [K('2025-12-31T20:59:00Z', 50), K('2026-01-01T00:00:00Z', 50.5), K('2026-01-01T00:59:00Z', 50.6), K('2026-01-02T14:30:00Z', 51)];
          var jahre = k.map(function (x) { return A.jahrVon(x[0]); });
          var o = ordnerVon(roh, 'SILV');
          var w25 = A.jahrSchreiben(o, 'SILV', 2025, k.slice(0, 3), KAL);
          var falsch = A.jahrSchreiben(o, 'SILV', 2026, [k[1]], KAL);
          var w26 = A.jahrSchreiben(o, 'SILV', 2026, [k[3]], KAL);
          var p25 = path.join(o, '2025.json'), p26 = path.join(o, '2026.json');
          H.betreten(w25.ok && fs.existsSync(p25) && fs.existsSync(p26), 'beide Jahresdateien geschrieben');
          var d25 = lies(p25), d26 = lies(p26);
          var sitz = d25.sitzungen.map(function (b) { return b.sitzung; }).join('>');
          var g = A.jahrGrenzen(2025);
          var abw = jahre.join(',') !== '2025,2025,2025,2026' || d25.series.length !== 3 || d26.series.length !== 1 || falsch.ok ||
            sitz !== 'regulaer>nach' || d25.jahr !== 2025 || g.bis + 1 !== A.jahrGrenzen(2026).von || g.bis !== Date.parse('2026-01-01T04:59:59.999Z');
          return { abweichung: abw,
            text: 'ET-Jahre ' + jahre.join(',') + ' (Soll 2025,2025,2025,2026); 2025.json ' + d25.series.length + ' Kerzen, Sitzungen ' + sitz + '; dieselbe Kerze ins Jahr 2026 verweigert=' + !falsch.ok +
              '; Grenze 2025/26 bei 05:00Z. ' + zl('function jahrGrenzen(jahr) {') };
        });
      } },

    /* ------------------------------------------------------------------ S4a */
    { id: 'AA-5', stoerung: 'S4 Kuerzel -> Ordner: BRK.B/BRK-B, HIW/HIw (Windows ohne Gross/Klein), CON, Neustart ohne _symbole.json', bewertung: '-',
      lauf: async function (H) {
        return mitWurzel('s4a', function (roh) {
          var syms = ['BRK.B', 'BRK-B', 'HIW', 'HIw', 'CON', 'con', 'AB.', 'AAC~2', 'AAC'];
          var namen = syms.map(A.ordnerName);
          var klein = {}; var kollision = [];
          namen.forEach(function (n, i) { var k = n.toLowerCase(); if (klein[k] !== undefined) kollision.push(syms[klein[k]] + '/' + syms[i]); klein[k] = i; });
          var geraet = namen.filter(function (n) { return A.GERAET.test(n) || /\.$/.test(n); });
          /* Abbildung wie die Vollsammlung sie schreibt (symbolAbbildung = ordnerName je Kuerzel) */
          var abb = {}; syms.forEach(function (s, i) { abb[s] = namen[i]; });
          var ps = metaSchreiben(roh, 'symbole', { ordner: abb });
          var mitDatei = syms.map(function (s) { return A.ordnerFuer(roh, s); });
          /* "Neustart" mit zerrissener _symbole.json: Regel greift - dieselben Ordner? */
          fs.writeFileSync(ps, '{"ordner":{"BRK.B":"BRK.B","HI'); fs.utimesSync(ps, 1790000000, 1790000000);
          var ohneDatei = syms.map(function (s) { return A.ordnerFuer(roh, s); });
          /* Auf der Platte (Windows: ohne Gross/Klein): HIW und HIw bekommen je eine eigene Datei */
          var KAL = kal(['2026-09-01']);
          A.jahrSchreiben(path.join(roh, A.ordnerFuer(roh, 'HIW')), 'HIW', 2026, [K('2026-09-01T13:30:00Z', 20)], KAL);
          A.jahrSchreiben(path.join(roh, A.ordnerFuer(roh, 'HIw')), 'HIw', 2026, [K('2026-09-01T13:30:00Z', 7)], KAL);
          var pa = A.jahrDatei(roh, 'HIW', 2026), pb = A.jahrDatei(roh, 'HIw', 2026);
          H.betreten(fs.existsSync(pa) && fs.existsSync(pb), 'zwei Jahresdateien fuer HIW und HIw');
          var da = lies(pa), db = lies(pb);
          var abw = kollision.length > 0 || geraet.length > 0 || namen[0] !== 'BRK.B' || mitDatei.join('|') !== ohneDatei.join('|') ||
            da.sym !== 'HIW' || db.sym !== 'HIw' || da.series[0][1] !== 20 || db.series[0][1] !== 7;
          return { abweichung: abw,
            text: 'Ordner ' + namen.join(', ') + '; Kollisionen ohne Gross/Klein: ' + (kollision.join(',') || 'keine') + '; Geraetenamen: ' + (geraet.join(',') || 'keine') +
              '; nach Neustart mit zerrissener _symbole.json dieselben Ordner=' + (mitDatei.join('|') === ohneDatei.join('|')) + '; HIW/HIw getrennt auf der Platte. ' + zl('function ordnerName(sym) {') };
        });
      } },

    /* ------------------------------------------------------------------ S4b */
    { id: 'AA-6', stoerung: 'S4 Kuerzel neu vergeben, Lebenszeit kennt die zweite Reihe noch nicht: neue Firma an die Datei der alten', bewertung: 'B',
      lauf: async function (H) {
        return mitWurzel('s4b', function (roh) {
          /* Lebenszeit vom 15.03.: AAC erloschen am 02.03., KEINE Reihe AAC~2 (Neuvergabe erst im August) */
          metaSchreiben(roh, 'lebenszeit', { stand: '2026-03-15T00:00:00.000Z', werte: { AAC: { erster: Date.parse('2016-01-04T05:00:00Z'), letzter: Date.parse('2026-03-02T05:00:00Z'), jahre: [2026] } } });
          var reihe = A.reiheFuer(roh, 'AAC');
          var o = path.join(roh, A.ordnerFuer(roh, reihe));
          if (!H.imTmp(o)) throw new Error('Ordner nicht im Wegwerf-Ordner');
          var KAL = kal(['2026-03-02', '2026-09-01']);
          var alt = fuenfMinuten('2026-03-02', '14:30', 10.00);           /* alte Firma, um 10 $ */
          var w1 = A.jahrSchreiben(o, reihe, 2026, alt, KAL);
          var p = path.join(o, '2026.json');
          H.betreten(w1.ok && fs.existsSync(p) && lies(p).series.length === 5, 'Datei der alten Firma mit 5 Kerzen');
          var neu = fuenfMinuten('2026-09-01', '13:30', 250.00);          /* neue Firma, um 250 $, 183 Tage spaeter */
          var w2 = A.jahrSchreiben(o, reihe, 2026, neu, KAL);
          var d = lies(p);
          var s = d.series;
          H.betreten(s.length === 10, 'Anhang der neuen Firma betreten');
          var luecke = Math.round((s[5][0] - s[4][0]) / 86400000), sprung = s[5][1] / s[4][1];
          var marke = JSON.stringify(d.quellen).indexOf('bruch') >= 0 || d.quellen.length > 1 || zusatzFelder(w2).length > 0;
          var abw = w2.ok && w2.geschrieben && !marke;
          return { abweichung: abw,
            text: 'reiheFuer(AAC)=' + reihe + ' (Lebenszeit ohne AAC~2); Anhang ok=' + w2.ok + ': ' + luecke + ' Tage Luecke und Kursfaktor ' + sprung.toFixed(1) + ' an der Naht, ohne Bruchmarke, quellen=' +
              d.quellen.length + ' Bereich. Soll: zwei Firmen nie still in einer Reihe (Kommentar ' + zl('KUERZEL-WIEDERVERWENDUNG: liefert die Quelle') + '). ' +
              zl("return (lzWerte && lzWerte[sym + '~2']) ? sym + '~2' : sym;") + ' / ' + zl('var neu = b.leer ? reihe : reihe.filter(') };
        });
      } },

    /* ------------------------------------------------------------------ S5a */
    { id: 'AA-7', stoerung: 'S5 _lebenszeit.json zerrissen: reiheFuer faellt still auf die erloschene Reihe', bewertung: 'B',
      lauf: async function (H) {
        return mitWurzel('s5a', function (roh) {
          var heil = { stand: '2026-10-01T00:00:00.000Z', werte: {
            AAC: { erster: 1451887200000, letzter: Date.parse('2021-06-01T04:00:00Z'), jahre: [2016, 2021], wiederverwendet: { schnitt: Date.parse('2021-06-01T23:59:00Z') } },
            'AAC~2': { erster: Date.parse('2021-07-01T04:00:00Z'), letzter: Date.parse('2026-09-30T04:00:00Z'), jahre: [2021, 2026] } } };
          var p = metaSchreiben(roh, 'lebenszeit', heil);
          fs.utimesSync(p, 1780000000, 1780000000);
          var vorher = A.reiheFuer(roh, 'AAC');
          H.betreten(vorher === 'AAC~2', 'heile Lebenszeit liefert die laufende Reihe AAC~2');
          var text = JSON.stringify(heil);
          fs.writeFileSync(p, text.slice(0, Math.floor(text.length * 0.6)));     /* halb geschrieben */
          fs.utimesSync(p, 1790000000, 1790000000);
          var nachher = A.reiheFuer(roh, 'AAC');
          var lz = A.lebenszeitDatei(roh);
          var gemeldet = Object.keys(lz).some(function (x) { return /grund|fehler|ok|kaputt/i.test(x); });
          var ordner = A.ordnerFuer(roh, nachher);
          var abw = nachher !== 'AAC~2' && !gemeldet;
          return { abweichung: abw,
            text: 'heile Lebenszeit -> ' + vorher + ', zerrissene -> ' + nachher + ' (Ordner ' + ordner + ' = erloschene Firma), lebenszeitDatei liefert ' + JSON.stringify(lz) +
              ' ohne Grund. Soll: unlesbar melden, nicht "keine Neuvergabe bekannt". ' + zl('} catch (e) { werte = {}; stand = null; }') };
        });
      } },

    /* ------------------------------------------------------------------ S5b */
    { id: 'AA-8', stoerung: 'S5 Vorgaenger-Reihe/Zwilling: neues Kuerzel liefert die Geschichte des alten (CPRI = KORS)', bewertung: 'B',
      lauf: async function (H) {
        return mitWurzel('s5b', function (roh) {
          var KAL = kal(['2018-12-28']);
          var gesch = fuenfMinuten('2018-12-28', '14:30', 33.10, 0.02);
          var wK = A.jahrSchreiben(ordnerVon(roh, 'KORS'), 'KORS', 2018, gesch, KAL);
          var wC = A.jahrSchreiben(ordnerVon(roh, 'CPRI'), 'CPRI', 2018, gesch.map(function (k) { return k.slice(); }), KAL);
          var pK = A.jahrDatei(roh, 'KORS', 2018), pC = A.jahrDatei(roh, 'CPRI', 2018);
          H.betreten(wK.ok && wC.ok && fs.existsSync(pK) && fs.existsSync(pC), 'beide Reihen geschrieben');
          var gleich = JSON.stringify(lies(pK).series) === JSON.stringify(lies(pC).series);
          var meldet = zusatzFelder(wC).length > 0;
          var abw = gleich && wC.geschrieben && !meldet;
          return { abweichung: abw,
            text: 'KORS/2018.json und CPRI/2018.json tragen Kerze fuer Kerze dieselbe Reihe (' + lies(pC).series.length + ' Kerzen, gleich=' + gleich + '); jahrSchreiben nahm beide ohne Hinweis an. ' +
              'Soll: Zwilling erkennen oder melden. ' + zl('function jahrSchreibenAusfuehren(ordner, sym, jahr, kerzen, kal, opt) {') };
        });
      } },

    /* ------------------------------------------------------------------ S7 */
    { id: 'AA-9', stoerung: 'S7 flache Kerzen o=h=l=c mit Umsatz 0 nach dem letzten Handel; fehlendes/negatives Umsatzfeld', bewertung: 'B',
      lauf: async function (H) {
        return mitWurzel('s7', function (roh) {
          var bars = [balken('2026-09-01T19:58:00Z', 10.0, 10.2, 9.9, 10.1, 1200)];
          for (var i = 0; i < 4; i++) bars.push(balken(new Date(Date.parse('2026-09-01T19:59:00Z') + i * 60000).toISOString(), 10.1, 10.1, 10.1, 10.1, 0));
          bars.push(balken('2026-09-01T20:03:00Z', 10.1, 10.1, 10.1, 10.1));       /* ohne v */
          bars.push(balken('2026-09-01T20:04:00Z', 10.1, 10.1, 10.1, 10.1, -5));   /* v negativ */
          var k = bars.map(A.kerzeAus).filter(Boolean);
          var o = ordnerVon(roh, 'FLACH');
          var w = A.jahrSchreiben(o, 'FLACH', 2026, k, kal(['2026-09-01']));
          var p = path.join(o, '2026.json');
          H.betreten(w.ok && fs.existsSync(p), 'Datei geschrieben');
          var s = lies(p).series;
          var flach = s.filter(function (x) { return x[2] === 0 && x[1] === x[3] && x[3] === x[4] && x[4] === x[5]; }).length;
          var abw = flach > 0;
          return { abweichung: abw,
            text: 'nach dem letzten Handel (19:58Z, Umsatz 1200) stehen ' + flach + ' flache Kerzen mit Umsatz 0 im Archiv (Soll 0: Alpaca-Balken entstehen aus Handel); ' +
              'fehlendes und negatives v wurden still zu 0 (' + s.slice(-2).map(function (x) { return x[2]; }).join(',') + '). ' + zl("var v = typeof b.v === 'number' && isFinite(b.v) && b.v >= 0 ? b.v : 0;") };
        });
      } },

    /* ------------------------------------------------------------------ S8 */
    { id: 'AA-10', stoerung: 'S8 Zeitumstellung (08.03.2026 / 01.11.2026): Bereiche vor/regulaer/nach', bewertung: '-',
      lauf: async function (H) {
        return mitWurzel('s8', function (roh) {
          var KAL = kal(['2026-03-06', '2026-03-09', '2026-10-30', '2026-11-02']);
          /* Soll aus der Uhrzeit von New York, in UTC von Hand: EST = UTC-5, EDT = UTC-4 */
          var faelle = [
            ['2026-03-06T14:29:00Z', 'vor'], ['2026-03-06T14:30:00Z', 'regulaer'], ['2026-03-06T20:59:00Z', 'regulaer'], ['2026-03-06T21:00:00Z', 'nach'],
            ['2026-03-09T13:29:00Z', 'vor'], ['2026-03-09T13:30:00Z', 'regulaer'], ['2026-03-09T19:59:00Z', 'regulaer'], ['2026-03-09T20:00:00Z', 'nach'],
            ['2026-10-30T13:30:00Z', 'regulaer'], ['2026-10-30T20:00:00Z', 'nach'],
            ['2026-11-02T14:29:00Z', 'vor'], ['2026-11-02T14:30:00Z', 'regulaer'], ['2026-11-02T20:59:00Z', 'regulaer'], ['2026-11-02T21:00:00Z', 'nach'],
            ['2026-03-08T15:00:00Z', 'ausserhalb']];
          var kerzen = faelle.map(function (f) { return K(f[0], 10); });
          var ist = A.sitzungJeKerze(kerzen, KAL);
          var falsch = [];
          faelle.forEach(function (f, i) { if (ist[i] !== f[1]) falsch.push(f[0] + ':' + ist[i]); });
          var tagNacht = A.etTag(Date.parse('2026-11-02T01:00:00Z'));
          var o = ordnerVon(roh, 'DST');
          var w = A.jahrSchreiben(o, 'DST', 2026, kerzen, KAL);
          H.betreten(w.ok && w.sitzungenZaehler && (w.sitzungenZaehler.regulaer + w.sitzungenZaehler.vor + w.sitzungenZaehler.nach + w.sitzungenZaehler.ausserhalb) === faelle.length, 'Datei mit allen Kerzen und Sitzungszaehlern');
          var abw = falsch.length > 0 || tagNacht !== '2026-11-01';
          return { abweichung: abw,
            text: faelle.length + ' Stempel um beide Umstellungen: ' + (falsch.length ? 'falsch ' + falsch.join(', ') : 'alle Bereiche richtig') + '; 02.11. 01:00Z gehoert zum ET-Tag ' + tagNacht +
              ' (Soll 2026-11-01). ' + zl('function sitzungJeKerze(kerzen, kal) {') };
        });
      } },

    /* ------------------------------------------------------------------ S9 */
    { id: 'AA-11', stoerung: 'S9 Feiertag / Kalender deckt den Tag nicht: Bereich "ausserhalb" wird festgeschrieben', bewertung: 'C',
      lauf: async function (H) {
        return mitWurzel('s9', function (roh) {
          /* (a) Thanksgiving 26.11.2026 - Kalender deckt November, Tag fehlt darin: 'ausserhalb' ist richtig */
          var kalNov = kal(['2026-11-24', '2026-11-25', '2026-11-27', '2026-11-30']);
          var feiertag = A.sitzungJeKerze([K('2026-11-26T15:00:00Z', 10)], kalNov)[0];
          /* (b) Kalender endet am 27.11. (deckt den 30.11. nicht) und (c) leerer Kalender {} */
          var kalKurz = kal(['2026-11-24', '2026-11-25', '2026-11-27']);
          var montag = fuenfMinuten('2026-11-30', '14:30', 10);
          var oB = ordnerVon(roh, 'KURZ'), oC = ordnerVon(roh, 'LEERK');
          var wB = A.jahrSchreiben(oB, 'KURZ', 2026, montag, kalKurz);
          var wC = A.jahrSchreiben(oC, 'LEERK', 2026, montag, {});
          var wD = A.jahrSchreiben(ordnerVon(roh, 'OHNE'), 'OHNE', 2026, montag, null);
          var pB = path.join(oB, '2026.json'), pC = path.join(oC, '2026.json');
          H.betreten(fs.existsSync(pB) && fs.existsSync(pC), 'beide Dateien geschrieben');
          var sB = lies(pB).sitzungen, sC = lies(pC).sitzungen;
          var abw = feiertag === 'ausserhalb' && wB.ok && wC.ok && sB.length === 1 && sB[0].sitzung === 'ausserhalb' && sC[0].sitzung === 'ausserhalb';
          return { abweichung: abw || feiertag !== 'ausserhalb',
            text: 'Feiertag -> ' + feiertag + ' (richtig, behalten); Handelstag 30.11. mit zu kurzem Kalender -> ' + sB[0].sitzung + ', mit leerem Kalender {} -> ' + sC[0].sitzung +
              ', beide ok=true und dauerhaft in der Datei (Studien nehmen nur "regulaer"); nur kal=null wird verweigert (ok=' + wD.ok + '). Soll: Kalender, der den Tag nicht deckt, wie fehlender Kalender verweigern. ' +
              zl("if (!kal || typeof kal !== 'object') return { ok: false, grund: 'ohne Kalender keine Sitzung") + ' / ' + zl("if (!g) return 'ausserhalb';") };
        });
      } },

    /* ------------------------------------------------------------------ S10 */
    { id: 'AA-12', stoerung: 'S10 Halbtag 27.11.2026 (regulaer bis 13:00 ET)', bewertung: '-',
      lauf: async function (H) {
        return mitWurzel('s10', function (roh) {
          var KAL = kal(['2026-11-30']); KAL['2026-11-27'] = { open: '09:30', close: '13:00' };
          var faelle = [['2026-11-27T17:59:00Z', 'regulaer'], ['2026-11-27T18:00:00Z', 'nach'], ['2026-11-27T20:59:00Z', 'nach'], ['2026-11-30T18:00:00Z', 'regulaer'], ['2026-11-30T20:59:00Z', 'regulaer']];
          var kerzen = faelle.map(function (f) { return K(f[0], 10); });
          var o = ordnerVon(roh, 'HALB');
          var w = A.jahrSchreiben(o, 'HALB', 2026, kerzen, KAL);
          var p = path.join(o, '2026.json');
          H.betreten(w.ok && fs.existsSync(p), 'Datei geschrieben');
          var ist = A.sitzungJeKerze(kerzen, KAL);
          var bereiche = lies(p).sitzungen.map(function (b) { return b.sitzung; }).join('>');
          var abw = faelle.some(function (f, i) { return ist[i] !== f[1]; }) || bereiche !== 'regulaer>nach>regulaer';
          return { abweichung: abw,
            text: 'Halbtag: 12:59 ET ' + ist[0] + ', 13:00 ET ' + ist[1] + ', 15:59 ET ' + ist[2] + '; Folgetag 13:00 ET ' + ist[3] + '; Bereiche in der Datei ' + bereiche + ' (Soll regulaer>nach>regulaer). ' +
              zl("if (k[0] >= g.zu) return 'nach';") };
        });
      } },

    /* ------------------------------------------------------------------ S11 */
    { id: 'AA-13', stoerung: 'S11 Kursaussetzung: Luecke mitten in der regulaeren Sitzung', bewertung: 'C',
      lauf: async function (H) {
        return mitWurzel('s11', function (roh) {
          var KAL = kal(['2026-09-01']);
          var k = fuenfMinuten('2026-09-01', '13:30', 40).concat(fuenfMinuten('2026-09-01', '17:00', 31));   /* 09:30-09:34, Aussetzung, 13:00-13:04 ET */
          var o = ordnerVon(roh, 'HALT');
          var w = A.jahrSchreiben(o, 'HALT', 2026, k, KAL);
          var p = path.join(o, '2026.json');
          H.betreten(w.ok && fs.existsSync(p) && lies(p).series.length === 10, 'Datei mit 10 Kerzen');
          var d = lies(p);
          var luecken = fs.existsSync(A.metaPfad(roh, 'luecken'));
          var bereich = d.sitzungen.map(function (b) { return b.sitzung + ' ' + new Date(b.von).toISOString().slice(11, 16) + '-' + new Date(b.bis).toISOString().slice(11, 16); }).join(', ');
          var gefuehrt = luecken || d.sitzungen.length > 1 || JSON.stringify(d).indexOf('luecke') >= 0;
          return { abweichung: !gefuehrt,
            text: 'Aussetzung 09:35-12:59 ET (205 Minuten): Datei fuehrt einen Bereich "' + bereich + '" ohne Lueckenvermerk, _luecken.json entsteht hier nicht (und zaehlt nur Tage). ' +
              'Keine erfundenen Kerzen - nur die Marke fehlt. ' + zl('function sitzungenAnhaengen(alt, serie, jeKerze) {') };
        });
      } },

    /* ------------------------------------------------------------------ Anhang aelter/doppelt/unsortiert */
    { id: 'AA-14', stoerung: 'Anhang mit Kerzen aelter als die juengste der Datei, doppelten Stempeln (anderer Inhalt), unsortiert', bewertung: 'C',
      lauf: async function (H) {
        return mitWurzel('anh', function (roh) {
          var KAL = kal(['2026-09-01']);
          var o = ordnerVon(roh, 'ANH');
          var p = path.join(o, '2026.json');
          var t = function (hm) { return '2026-09-01T' + hm + ':00Z'; };
          /* Bestand mit Loch: 13:32 fehlt */
          A.jahrSchreiben(o, 'ANH', 2026, [K(t('13:30'), 1), K(t('13:31'), 2), K(t('13:33'), 4), K(t('13:34'), 5)], KAL);
          H.betreten(fs.existsSync(p) && lies(p).series.length === 4, 'Bestand mit 4 Kerzen');
          var eingang = [K(t('13:36'), 7), K(t('13:32'), 3), K(t('13:31'), 99), K(t('13:35'), 6), K(t('13:35'), 66)];
          var w = A.jahrSchreiben(o, 'ANH', 2026, eingang, KAL);
          var s = lies(p).series;
          var sortiert = s.every(function (x, i) { return i === 0 || x[0] > s[i - 1][0]; });
          H.betreten(w.ok && w.geschrieben && s.length === 6 && sortiert, 'Anhang betreten, Datei sortiert');
          var loch = !s.some(function (x) { return x[0] === Date.parse(t('13:32')); });
          var getrennt = zusatzFelder(w).length > 0;
          var abw = loch && !getrennt;
          return { abweichung: abw,
            text: 'Eingang 5 Kerzen: 13:32 (fehlte im Bestand) still verworfen und fuer immer verloren, 13:31 mit anderem Schluss (99) uebersprungen, 13:35 doppelt (erste gewinnt, 6 statt 66); ' +
              'Rueckgabe nur uebersprungen=' + w.uebersprungen + ' fuer drei verschiedene Dinge. Sortieren richtig=' + sortiert + '. ' + zl('var uebersprungen = kerzen.length - neu.length;') + ' / ' +
              zl('kerzen.forEach(function (k) { if (karte[k[0]] === undefined) karte[k[0]] = k; });') };
        });
      } },

    /* ------------------------------------------------------------------ Hoch < Tief */
    { id: 'AA-15', stoerung: 'Hoch < Tief (und Hoch < Schluss) im Balken der Quelle', bewertung: 'B',
      lauf: async function (H) {
        return mitWurzel('hl', function (roh) {
          var b = [balken('2026-09-01T13:30:00Z', 10.0, 10.2, 9.9, 10.1, 500), balken('2026-09-01T13:31:00Z', 10.0, 9.5, 10.5, 10.0, 500)];
          var k = b.map(A.kerzeAus);
          var o = ordnerVon(roh, 'HL');
          var w = A.jahrSchreiben(o, 'HL', 2026, k.filter(Boolean), kal(['2026-09-01']));
          var p = path.join(o, '2026.json');
          H.betreten(w.ok && fs.existsSync(p), 'Datei geschrieben');
          var s = lies(p).series;
          var verkehrt = s.filter(function (x) { return x[3] < x[4] || x[3] < Math.max(x[1], x[5]) || x[4] > Math.min(x[1], x[5]); }).length;
          return { abweichung: verkehrt > 0,
            text: 'Balken mit Hoch 9,5 < Tief 10,5 angenommen und geschrieben (' + verkehrt + ' verkehrte Kerze im Archiv, Soll 0 - wie Kurs 0/NaN verwerfen). ' +
              zl('if (!KQ.kursOk(b.c) || !KQ.kursOk(b.h) || !KQ.kursOk(b.l) || !KQ.kursOk(b.o)) return null;') };
        });
      } },

    /* ------------------------------------------------------------------ Journal / abgeschnitten / Kopf */
    { id: 'AA-16', stoerung: 'Absturz mitten im Anhang (Journal), abgeschnittene Datei ohne Journal, Kopf-Feld anderer Laenge', bewertung: '-',
      lauf: async function (H) {
        return mitWurzel('jou', function (roh) {
          var KAL = kal(['2026-09-01']);
          var bestand = fuenfMinuten('2026-09-01', '13:30', 20), dazu = fuenfMinuten('2026-09-01', '13:40', 21);
          /* Vergleich: eine Datei in einem Zug */
          var oRef = ordnerVon(roh, 'REF');
          A.jahrSchreiben(oRef, 'J', 2026, bestand, KAL); A.jahrSchreiben(oRef, 'J', 2026, dazu, KAL);
          /* (a) Absturz im Schwanz, dann derselbe Anhang noch einmal */
          var o = ordnerVon(roh, 'J');
          var p = path.join(o, '2026.json');
          A.jahrSchreiben(o, 'J', 2026, bestand, KAL);
          var geworfen = false;
          try { A.jahrSchreiben(o, 'J', 2026, dazu, KAL, { abbruchBei: 'im-schwanz' }); } catch (e) { geworfen = /Abbruch-Probe/.test(e.message); }
          var journalDa = fs.existsSync(A.journalPfad(p));
          var zerrissen = false; try { JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { zerrissen = true; }
          var leserSieht = A.letzterStempel(p);
          H.betreten(geworfen && journalDa && zerrissen, 'Absturz mitten im Schwanz nachgestellt (Datei zerrissen, Journal liegt)');
          var w = A.jahrSchreiben(o, 'J', 2026, dazu, KAL);
          var heil = lies(p), ref = lies(path.join(oRef, '2026.json'));
          var gleich = JSON.stringify(heil.series) === JSON.stringify(ref.series) && JSON.stringify(heil.sitzungen) === JSON.stringify(ref.sitzungen) &&
            JSON.stringify(heil.quellen) === JSON.stringify(ref.quellen);
          /* (b) abgeschnittene Datei ohne Journal */
          var oB = ordnerVon(roh, 'AB'); A.jahrSchreiben(oB, 'AB', 2026, bestand, KAL);
          var pB = path.join(oB, '2026.json'); var ganz = fs.readFileSync(pB);
          fs.writeFileSync(pB, ganz.slice(0, Math.floor(ganz.length / 2)));
          var vorB = fs.readFileSync(pB);
          var wB = A.jahrSchreiben(oB, 'AB', 2026, dazu, KAL);
          var bUnberuehrt = Buffer.compare(vorB, fs.readFileSync(pB)) === 0;
          /* (c) Kopf: stand ohne Millisekunden (20 statt 24 Zeichen) */
          var oC = ordnerVon(roh, 'KO'); A.jahrSchreiben(oC, 'KO', 2026, bestand, KAL);
          var pC = path.join(oC, '2026.json');
          fs.writeFileSync(pC, fs.readFileSync(pC, 'utf8').replace(/"stand":"[^"]*"/, '"stand":"2026-09-01T20:00:00Z"'));
          var vorC = fs.readFileSync(pC);
          var wC = A.jahrSchreiben(oC, 'KO', 2026, dazu, KAL);
          var cUnberuehrt = Buffer.compare(vorC, fs.readFileSync(pC)) === 0;
          var abw = !(w.ok && w.geschrieben && gleich && !fs.existsSync(A.journalPfad(p)) && leserSieht === null) || wB.ok || !bUnberuehrt || wC.ok || !cUnberuehrt;
          return { abweichung: abw,
            text: '(a) nach Absturz sieht der Leser null statt eines falschen Stempels, der naechste Anhang spielt das Journal zurueck: Datei gleich der in einem Zug geschriebenen=' + gleich +
              '; (b) halbe Datei ohne Journal: verweigert ("' + String(wB.grund).slice(0, 40) + '...") und unberuehrt=' + bUnberuehrt +
              '; (c) stand anderer Laenge: verweigert ("' + wC.grund + '") und unberuehrt=' + cUnberuehrt + '. ' + zl('var rep = journalReparieren(pfad);') };
        });
      } }
  ]
};

/** Eine ANDERE feste Uhr innerhalb eines laufenden Tests (synchron). H.mitUhr stellt danach die echte
 *  Uhr zurueck - hier wird die vorige (die feste des Tests) wiederhergestellt. */
function mitWurzelUhr(jetzt, fn) {
  var vorher = global.Date;
  try { return H.mitUhr(jetzt, fn); } finally { global.Date = vorher; }
}

H.allein(module);
