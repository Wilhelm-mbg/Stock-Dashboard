'use strict';
/* SKALEN-PROBE: welche Alpaca-Bereinigung entspricht der Yahoo-Skala? (Z1, 03.09.2026)
 *
 *   node studien/archiv-zusammenfuehrung-2026-09/skalen-probe-alpaca.js
 *
 * DIE FRAGE. Yahoo rechnet Intraday-Kurse nach einer Kapitalmassnahme rueckwirkend um,
 * Alpaca mit adjustment=raw nicht. Der Z1-Nachholer hat deshalb bei MNST (Split 2:1,
 * wirksam 11.08.2026) und SPGI (Abspaltung, wirksam 01.07.2026) Balken auf der falschen
 * Skala in die Yahoo-Mischdateien geschrieben. Bevor irgendetwas ersetzt wird, muss
 * GEMESSEN sein, welche der vier Alpaca-Bereinigungen (raw, split, dividend, all)
 * Splits UND Abspaltungen so behandelt wie Yahoo - geraten wird nicht.
 *
 * DER AUFBAU. Vier Faelle: je Wert ein Tag VOR der Massnahme (dort trennen sich die
 * Skalen) und ein Tag DANACH (Gegenprobe: dort muessen alle Bereinigungen gleich sein -
 * eine Bereinigung, die am Kontrolltag abweicht, ist nicht "Yahoo mit Massnahme",
 * sondern etwas anderes). Je Fall werden die 5Min-Balken des Tages mit jeder der vier
 * Bereinigungen geholt und an den GEMEINSAMEN Stempeln gegen die Yahoo-Kerzen der
 * 5m-Archivdatei gehalten - nur gegen Kerzen, die die Datei als quelle 'yahoo' fuehrt,
 * denn die Alpaca-Kerzen derselben Datei sind ja gerade das, was zur Debatte steht.
 * Gemessen wird der TAGESMEDIAN des Verhaeltnisses Alpaca/Yahoo.
 *
 * DIE KRITERIEN STEHEN HIER, VOR DEM LAUF (wiki/fehlerformen.md, "Vorregistrierung"):
 *   K1  Je Fall mindestens MIND_STEMPEL gemeinsame Stempel - sonst ist der Tagesmedian
 *       keine Messung, sondern ein Zufall.
 *   K2  Eine Bereinigung "entspricht Yahoo", wenn ihr Tagesmedian in ALLEN VIER Faellen
 *       in [1-BAND, 1+BAND] liegt. Drei von vier genuegen nicht: eine Bereinigung, die
 *       den Split trifft und die Abspaltung verfehlt, ist fuer dieses Archiv unbrauchbar.
 *   K3  Bestehen mehrere, gewinnt die SCHWAECHSTE (raw < split < dividend < all) - die
 *       am wenigsten in die Kurse eingreift und damit am wenigsten kuenftige Massnahmen
 *       rueckwirkend verschiebt.
 *   K4  Besteht keine, wird nichts geraten: die Probe weist je Wert den gemessenen
 *       Tagesmedian als FAKTOR aus, und die Reparatur rechnet damit.
 *
 * Zugang: nur ueber schluessel.js der Spannen-Studie. Diese Datei kennt die
 * Umgebungsnamen nicht; jede Ausgabe laeuft durch verdecken(). Sie SCHREIBT NICHTS
 * ins Archiv - nur ihr eigenes Ergebnis in den Studienordner.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var KQ = require('../../kerzenquelle.js');
var S = require('../vorregistrierung-2026-09-02-spannen-historisch/schluessel.js');

var DATEN = 'https://data.alpaca.markets/v2';
var WURZEL = process.env.MD_ARCHIV_WURZEL || 'E:/Markt-Dashboard-Archiv';
var ZIEL = __dirname;
var BEREINIGUNGEN = ['raw', 'split', 'dividend', 'all'];   /* Reihenfolge = Rangfolge fuer K3 */
var BAND = 0.001;          /* K2: 0,999 - 1,001, dieselbe Schwelle wie die Skalenpruefung */
var MIND_STEMPEL = 50;     /* K1 */

/* Die vier Faelle. Die Wirksamkeitstage stehen NICHT aus einer Meldung hier, sondern
 * aus der Messung an den Quellengrenzen der Archivdateien (03.09.2026): MNST bricht
 * zwischen dem 10. und dem 11.08. von Faktor 2,00000 auf 1,00005, SPGI zwischen dem
 * 30.06. und dem 01.07. von 1,05700 auf 1,00011. */
var FAELLE = [
  { sym: 'MNST', tag: '2026-08-06', art: 'vor',  massnahme: 'Split 2:1, wirksam 11.08.2026' },
  { sym: 'MNST', tag: '2026-08-20', art: 'nach', massnahme: 'Split 2:1, wirksam 11.08.2026' },
  { sym: 'SPGI', tag: '2026-06-25', art: 'vor',  massnahme: 'Abspaltung, wirksam 01.07.2026' },
  { sym: 'SPGI', tag: '2026-07-15', art: 'nach', massnahme: 'Abspaltung, wirksam 01.07.2026' },
];

function sag(t) { process.stdout.write(S.verdecken(t) + '\n'); }
function pause(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function median(a) {
  if (!a.length) return null;
  var s = a.slice().sort(function (x, y) { return x - y; });
  var m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

var abrufe = 0;
async function hole(url) {
  for (var v = 1; v <= 4; v++) {
    abrufe++;
    var res, text;
    try {
      res = await globalThis.fetch(url, { headers: S.kopfzeilen(), signal: AbortSignal.timeout(60000) });
      text = await res.text();
    } catch (e) { if (v === 4) return { status: 0, text: 'netz' }; await pause(1000 * v); continue; }
    if (res.status === 429 || res.status >= 500) { await pause(2000 * v); continue; }
    var daten = null;
    try { daten = JSON.parse(text); } catch (e2) { daten = null; }
    return { status: res.status, text: text, daten: daten };
    }
  return { status: 0, text: 'aufgegeben' };
}

/** Die Yahoo-Kerzen EINES Tages aus der 5m-Archivdatei - nur die, die die Datei als
 *  quelle 'yahoo' fuehrt, und nur mit Umsatz (Quote-Kerzen tragen H=T=S und waeren als
 *  Massstab wertlos). Ergebnis: { stempel -> schluss }. */
function yahooTag(sym, tag) {
  var p = path.join(WURZEL, 'archiv5m', 'bars_5m_' + sym + '.json');
  var h = KQ.huelleLesen(p);
  if (!h) throw new Error('Archivdatei fehlt oder ist unlesbar: ' + p);
  var jk = KQ.quelleJeKerze(h.series, h.quellen);
  var NY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
  var aus = {}, umsatz = {}, n = 0;
  h.series.forEach(function (k, i) {
    if (!jk[i] || jk[i].quelle !== 'yahoo') return;
    if (!(k[2] > 0) || !(k[1] > 0)) return;
    if (NY.format(new Date(k[0])) !== tag) return;
    aus[k[0]] = k[1]; umsatz[k[0]] = k[2]; n++;
  });
  return { schluss: aus, umsatz: umsatz, n: n };
}

/** 5Min-Balken eines UTC-Tages mit einer bestimmten Bereinigung. Der ganze Tag wird
 *  angefragt und danach auf die gemeinsamen Stempel geschnitten - der Zuschnitt macht
 *  die Sitzungsgrenzen ueberfluessig, weil die Yahoo-Datei ohnehin nur die regulaere
 *  Sitzung fuehrt. */
async function alpacaTag(sym, tag, bereinigung) {
  var url = DATEN + '/stocks/bars?symbols=' + encodeURIComponent(sym) + '&timeframe=5Min' +
    '&start=' + tag + 'T00:00:00Z&end=' + tag + 'T23:59:59Z&limit=10000&feed=sip&adjustment=' + bereinigung;
  var r = await hole(url);
  if (r.status !== 200) return { fehler: 'HTTP ' + r.status + ' ' + String(r.text || '').replace(/\s+/g, ' ').slice(0, 120) };
  var b = r.daten && r.daten.bars ? r.daten.bars[sym] : null;
  var aus = {}, umsatz = {}, n = 0;
  (Array.isArray(b) ? b : []).forEach(function (x) {
    var t = Date.parse(x && x.t);
    if (!isFinite(t) || !(x.c > 0)) return;
    aus[t] = x.c; umsatz[t] = x.v; n++;
  });
  return { schluss: aus, umsatz: umsatz, n: n };
}

async function lauf() {
  if (!S.vorhanden()) { console.error('Umgebungswerte fehlen (' + S.fehlend().join(', ') + ').'); process.exit(1); }
  sag('Skalen-Probe: welche Alpaca-Bereinigung entspricht Yahoo?');
  sag('Kriterien (vor dem Lauf festgelegt): K1 >= ' + MIND_STEMPEL + ' gemeinsame Stempel je Fall, K2 Tagesmedian in ' +
      (1 - BAND).toFixed(3) + '-' + (1 + BAND).toFixed(3) + ' in ALLEN vier Faellen, K3 die schwaechste passende gewinnt, K4 sonst Faktor ausweisen.\n');

  var messungen = [];
  for (var i = 0; i < FAELLE.length; i++) {
    var f = FAELLE[i];
    var y = yahooTag(f.sym, f.tag);
    sag(f.sym + '  ' + f.tag + '  (' + f.art + ' der Massnahme: ' + f.massnahme + ')  Yahoo-Kerzen im Archiv: ' + y.n);
    for (var b = 0; b < BEREINIGUNGEN.length; b++) {
      var ber = BEREINIGUNGEN[b];
      var a = await alpacaTag(f.sym, f.tag, ber);
      if (a.fehler) { sag('    ' + ber.padEnd(9) + 'FEHLER ' + a.fehler); messungen.push({ sym: f.sym, tag: f.tag, art: f.art, bereinigung: ber, fehler: a.fehler }); continue; }
      var verh = [], uVerh = [];
      Object.keys(y.schluss).forEach(function (t) {
        if (a.schluss[t] > 0) verh.push(a.schluss[t] / y.schluss[t]);
        /* Der Umsatz wird MITGEMESSEN, nicht beurteilt: die Kriterien K1-K4 oben sind
         * Preis-Kriterien und bleiben unveraendert. Die Zahl wird gebraucht, weil ein
         * Split die Stueckzahl mitdreht (Yahoo verdoppelt den historischen Umsatz), eine
         * Abspaltung nicht - welche von beidem, wird gemessen statt angenommen. */
        if (a.umsatz[t] > 0 && y.umsatz[t] > 0) uVerh.push(y.umsatz[t] / a.umsatz[t]);
      });
      var m = median(verh), um = median(uVerh);
      var spanne = verh.length ? [Math.min.apply(null, verh), Math.max.apply(null, verh)] : null;
      messungen.push({ sym: f.sym, tag: f.tag, art: f.art, bereinigung: ber, gemeinsam: verh.length,
        alpacaKerzen: a.n, yahooKerzen: y.n, median: m, min: spanne ? spanne[0] : null, max: spanne ? spanne[1] : null,
        umsatzMedianYahooDurchAlpaca: um, umsatzN: uVerh.length });
      sag('    ' + ber.padEnd(9) + 'gemeinsam ' + String(verh.length).padStart(3) + '   Median Alpaca/Yahoo ' +
          (m == null ? '–' : m.toFixed(6)) + (spanne ? '   Spanne ' + spanne[0].toFixed(6) + ' .. ' + spanne[1].toFixed(6) : '') +
          '   Umsatz Yahoo/Alpaca ' + (um == null ? '–' : um.toFixed(4)));
      await pause(400);
    }
    sag('');
  }

  /* ---------- Urteil nach K1-K4 ---------- */
  var jeBereinigung = {};
  BEREINIGUNGEN.forEach(function (ber) {
    var m = messungen.filter(function (x) { return x.bereinigung === ber; });
    var genugStempel = m.every(function (x) { return !x.fehler && x.gemeinsam >= MIND_STEMPEL; });
    var imBand = m.every(function (x) { return !x.fehler && x.median != null && Math.abs(x.median - 1) <= BAND; });
    jeBereinigung[ber] = { k1: genugStempel, k2: imBand, faelle: m.map(function (x) { return { sym: x.sym, tag: x.tag, art: x.art, median: x.median, gemeinsam: x.gemeinsam, fehler: x.fehler || null }; }) };
  });
  var passend = BEREINIGUNGEN.filter(function (ber) { return jeBereinigung[ber].k1 && jeBereinigung[ber].k2; });
  var gewaehlt = passend.length ? passend[0] : null;    /* K3: BEREINIGUNGEN ist die Rangfolge */

  /* K4: keine passt -> je Wert den gemessenen Faktor ausweisen. Der Faktor ist der
   * Tagesmedian am Tag VOR der Massnahme, bei der schwaechsten Bereinigung (raw). */
  var faktoren = {}, umsatzFaktoren = {};
  if (!gewaehlt) {
    messungen.filter(function (x) { return x.art === 'vor' && x.bereinigung === 'raw' && !x.fehler; })
      .forEach(function (x) { faktoren[x.sym] = x.median; umsatzFaktoren[x.sym] = x.umsatzMedianYahooDurchAlpaca; });
  }

  var erg = { erzeugt: new Date().toISOString(), abrufe: abrufe, band: BAND, mindStempel: MIND_STEMPEL,
    faelle: FAELLE, messungen: messungen, jeBereinigung: jeBereinigung,
    urteil: { passend: passend, gewaehlt: gewaehlt, faktorenWennKeine: faktoren, umsatzFaktorenWennKeine: umsatzFaktoren } };
  fs.writeFileSync(path.join(ZIEL, 'skalen-probe-ergebnis.json'), S.verdecken(JSON.stringify(erg, null, 1)));

  sag('Urteil:');
  BEREINIGUNGEN.forEach(function (ber) {
    var j = jeBereinigung[ber];
    sag('  ' + ber.padEnd(9) + (j.k1 ? 'K1 ok' : 'K1 FEHLT') + '  ' + (j.k2 ? 'K2 ok (alle vier Faelle im Band)' : 'K2 FEHLT') +
        '   Mediane: ' + j.faelle.map(function (x) { return x.sym + ' ' + x.art + ' ' + (x.median == null ? '–' : x.median.toFixed(5)); }).join(' | '));
  });
  if (gewaehlt) sag('\nGEWAEHLT: adjustment=' + gewaehlt + ' - entspricht Yahoo bei Split UND Abspaltung' +
                    (passend.length > 1 ? ' (schwaechste von: ' + passend.join(', ') + ')' : ''));
  else sag('\nKEINE Bereinigung entspricht Yahoo. Gemessene Faktoren am Tag vor der Massnahme (K4) - Kurs raw/Yahoo, Umsatz Yahoo/raw: ' +
           Object.keys(faktoren).map(function (s) { return s + ' Kurs ' + faktoren[s].toFixed(5) + ' / Umsatz ' + (umsatzFaktoren[s] == null ? '–' : umsatzFaktoren[s].toFixed(4)); }).join(', '));
  sag('Ergebnis: ' + path.join(ZIEL, 'skalen-probe-ergebnis.json') + '  (' + abrufe + ' Abrufe)');
  return erg;
}

if (require.main === module) {
  lauf().then(function (e) { process.exit(e.urteil.gewaehlt ? 0 : 3); },
    function (e) { console.error('ABBRUCH: ' + S.verdecken(String(e && e.message || e))); process.exit(1); });
}

module.exports = { yahooTag: yahooTag, median: median, FAELLE: FAELLE, BEREINIGUNGEN: BEREINIGUNGEN, BAND: BAND, MIND_STEMPEL: MIND_STEMPEL };
