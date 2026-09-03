'use strict';
/* ================= SCHRITT 0 (Z1): Probe an den Alpaca-Balken =================
 *
 * Zweck: EINE Frage vor dem Bau des Nachholers - liefert der Gratis-Tarif historische
 * Minutenbalken (feed=sip), und sind sie DASSELBE wie Yahoos Kerzen? Wilhelms Entscheid
 * vom 03.09.2026 (wiki/archiv-zusammenfuehrung.md Paragraph 6, Punkt 2): die CFD-markierte
 * 1m-Tiefe wird verworfen und aus Alpaca neu geholt - FALLS diese Probe besteht. Faellt
 * sie durch, bleibt die 1m-Tiefe bei den Yahoo-Kerzen, und das steht dann so im Wiki.
 *
 * Diese Probe MISST NICHTS. Sie stellt fest:
 *   1. HTTP-Status und Tarif (401/403/422 = Abweisung), Ratengrenze laut Kopfzeile
 *   2. ob das gelieferte Jahr das angefragte ist (die iex-Falle: 2018 angefragt, 2020
 *      geliefert, HTTP 200 - wiki/datenquellen.md)
 *   3. ob der Zeitstempel die BALKENOEFFNUNG ist (Yahoo-Konvention): der erste Balken
 *      der regulaeren Sitzung muss auf 09:30 ET liegen, alle Stempel auf Sekunde 0
 *   4. ob vor- und nachboersliche Balken mitkommen (dann filtert der Nachholer auf die
 *      regulaere Sitzung laut /v2/calendar)
 *   5. Balkenzahl je Tag in der regulaeren Sitzung (390 auf 1Min, 78 auf 5Min)
 *   6. gegen die Yahoo-Datei desselben Tages: gemeinsame Stempel, Abweichung im Schluss
 *      (Erwartung <= 0,1 %), Umsatz-Faktor (Erwartung ~1 - ein Faktor 500 hiesse, es
 *      ist etwas anderes als Boersenvolumen)
 *   7. die Schreibweise von BRK.B
 *
 * Werte: AAPL, MU, ARM, ORCL, BRK.B - je ein Tag 2016, 2020, 2024, 2026, je 1Min, 5Min,
 * 1Hour. ARM ist erst seit 09/2023 notiert: 2016 und 2020 MUESSEN dort leer sein, und
 * eine Antwort mit Balken waere ein Befund gegen die Quelle.
 *
 * Yahoo-Vergleich nur, wo die Datei den Tag hat: 1m reicht ~7-12 Handelstage zurueck
 * (nur 2026), 5m 60 Tage (nur 2026), 60m 730 Tage (2024 und 2026). Auf 60m liegt Yahoos
 * Gitter auf :30 - hat Alpaca dort :00, gibt es keine gemeinsamen Stempel, und das ist
 * dann ein Befund ueber das Gitter, kein Durchfallen.
 *
 * Zugang: ausschliesslich ueber schluessel.js der Spannen-Studie. Diese Datei kennt die
 * Umgebungsnamen nicht und gibt nichts aus, was nicht durch verdecken() gelaufen ist.
 * Das Ergebnis geht sofort auf die Platte (probe-alpaca-balken-ergebnis.json und
 * -ausgabe.txt in diesem Ordner) - das Urteil dort liest der Nachholer als Freigabe.
 *
 * Aufruf (Wilhelm, in seinem eigenen Terminal, mit ALPACA_KEY/ALPACA_SECRET gesetzt):
 *     node studien/archiv-zusammenfuehrung-2026-09/probe-alpaca-balken.js
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */

var fs = require('fs');
var path = require('path');
var S = require('../vorregistrierung-2026-09-02-spannen-historisch/schluessel.js');
var KQ = require('../../kerzenquelle.js');
var M = require('../../tools/archiv-migration.js');

var DATEN = 'https://data.alpaca.markets/v2';
var HANDEL = 'https://paper-api.alpaca.markets/v2';
var SYMBOLE = ['AAPL', 'MU', 'ARM', 'ORCL', 'BRK.B'];
var TAGE = ['2016-06-01', '2020-06-03', '2024-06-05', '2026-08-27'];
var RAHMEN = [['1Min', '1m', 390], ['5Min', '5m', 78], ['1Hour', '60m', 7]];
var ERGEBNIS = path.join(__dirname, 'probe-alpaca-balken-ergebnis.json');
var AUSGABE = path.join(__dirname, 'probe-alpaca-balken-ausgabe.txt');

var zeilen = [];
/** Ausgabe. Laeuft ausnahmslos durch verdecken() - Bildschirm UND Datei. */
function sag(text) { var t = S.verdecken(text); zeilen.push(t); process.stdout.write(t + '\n'); }
function pause(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/** Ein Abruf. Gibt IMMER ein Ergebnis zurueck, nie eine Ausnahme. `hole` ist
 *  einspeisbar, damit der Selbsttest einen boesartigen Server stellen kann. */
async function abruf(url, hole) {
  var f = hole || globalThis.fetch;
  try {
    var res = await f(url, { headers: S.kopfzeilen(), signal: AbortSignal.timeout(60000) });
    var text = await res.text();
    var daten = null;
    try { daten = JSON.parse(text); } catch (e) { daten = null; }
    return { status: res.status, text: text, daten: daten,
             grenze: res.headers && res.headers.get ? (res.headers.get('x-ratelimit-limit') || '') : '' };
  } catch (e) {
    return { status: 0, text: 'Netzfehler: ' + (e && e.message ? e.message : String(e)), daten: null, grenze: '' };
  }
}

/** Alle Balken eines Symbols fuer einen Zeitraum, Seite fuer Seite. */
async function balken(sym, rahmen, von, bis) {
  var alle = [], token = null, status = null, grenze = '', rumpf = '', seiten = 0;
  do {
    var url = DATEN + '/stocks/bars?symbols=' + encodeURIComponent(sym) + '&timeframe=' + rahmen +
      '&start=' + encodeURIComponent(von) + '&end=' + encodeURIComponent(bis) +
      '&limit=10000&feed=sip&adjustment=raw' + (token ? '&page_token=' + encodeURIComponent(token) : '');
    var r = await abruf(url);
    status = r.status; grenze = r.grenze || grenze; seiten++;
    if (r.status !== 200) { rumpf = String(r.text || '').replace(/\s+/g, ' ').slice(0, 240); break; }
    var b = r.daten && r.daten.bars ? r.daten.bars[sym] : null;
    if (Array.isArray(b)) alle = alle.concat(b);
    token = r.daten ? r.daten.next_page_token : null;
    if (seiten > 5) break;
  } while (token);
  return { status: status, grenze: grenze, rumpf: rumpf, balken: alle, seiten: seiten };
}

/** Der Handelskalender fuer einen Tag: { open, close } in ET oder null. */
async function kalender(tag) {
  var r = await abruf(HANDEL + '/calendar?start=' + tag + '&end=' + tag);
  if (r.status !== 200 || !Array.isArray(r.daten)) return { status: r.status, tag: null };
  var t = r.daten.filter(function (x) { return x && x.date === tag; })[0] || null;
  return { status: r.status, tag: t };
}
function etNachUtc(tag, hhmm) {
  var p = tag.split('-').map(Number), u = hhmm.split(':').map(Number);
  return M.nyNachUtc(p[0], p[1], p[2], u[0], u[1]);
}

/** Yahoo-Kerzen desselben Tages aus der Dateisammlung (nur lesend). */
function yahooTag(sym, iv, tag) {
  var datei = KQ.dateiFuer(sym, iv, KQ.ordnerVon(iv));
  var h = KQ.huelleLesen(datei);
  if (!h) return null;
  var von = Date.parse(tag + 'T00:00:00Z'), bis = von + 86400000;
  var karte = {};
  h.series.forEach(function (k) { if (k[0] >= von && k[0] < bis) karte[k[0]] = k; });
  return { karte: karte, n: Object.keys(karte).length, datei: datei };
}
function median(a) { if (!a.length) return null; var s = a.slice().sort(function (x, y) { return x - y; }); var m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

/** Der Vergleich Alpaca gegen Yahoo auf gemeinsamen Stempeln. Rein. */
function vergleiche(balkenListe, yahooKarte) {
  var gemeinsam = 0, abw = [], faktoren = [], ueber = 0;
  balkenListe.forEach(function (b) {
    var t = Date.parse(b.t), y = yahooKarte[t];
    if (!y) return;
    gemeinsam++;
    if (typeof y[1] === 'number' && y[1] > 0 && typeof b.c === 'number') {
      var a = Math.abs(b.c - y[1]) / y[1];
      abw.push(a);
      if (a > 0.001) ueber++;
    }
    if (y[2] > 0 && b.v > 0) faktoren.push(b.v / y[2]);
  });
  return { gemeinsam: gemeinsam, medianAbw: median(abw), maxAbw: abw.length ? Math.max.apply(null, abw) : null,
           ueber01Prozent: ueber, faktorMedian: median(faktoren), faktorN: faktoren.length };
}

async function main() {
  sag('=== Probe: Alpaca-Balken gegen Yahoo-Kerzen (Z1, Schritt 0) - ' + new Date().toISOString() + ' ===');
  sag('');
  if (!S.vorhanden()) {
    sag('ABBRUCH: Umgebungswerte fehlen (' + S.fehlend().join(', ') + ').');
    sag('Setze sie in DEINEM Terminal und starte die Probe erneut. Sie werden nirgends');
    sag('gespeichert, ausgegeben oder in eine Adresse gehaengt.');
    return;
  }
  var E = { erzeugt: new Date().toISOString(), tage: {}, abrufe: [], brkb: null, urteil: null };
  var tarif = 0, netz = 0, falschesJahr = 0, mitBalken = 0, leer = 0;

  /* Kalender je Tag - die regulaere Sitzung kommt aus der Quelle, nicht aus dem Kopf. */
  for (var i = 0; i < TAGE.length; i++) {
    var k = await kalender(TAGE[i]);
    E.tage[TAGE[i]] = k.tag ? { open: k.tag.open, close: k.tag.close,
      openUtc: new Date(etNachUtc(TAGE[i], k.tag.open)).toISOString(), closeUtc: new Date(etNachUtc(TAGE[i], k.tag.close)).toISOString() } : { fehler: 'HTTP ' + k.status };
    sag('Kalender ' + TAGE[i] + ': ' + JSON.stringify(E.tage[TAGE[i]]));
    await pause(300);
  }
  sag('');

  for (var s = 0; s < SYMBOLE.length; s++) {
    var sym = SYMBOLE[s];
    for (var d = 0; d < TAGE.length; d++) {
      var tag = TAGE[d], kal = E.tage[tag];
      var von = tag + 'T08:00:00Z', bis = tag + 'T23:59:00Z';    /* 04:00 ET bis nach 20:00 ET, deckt Vor- und Nachboerse */
      for (var r = 0; r < RAHMEN.length; r++) {
        var rahmen = RAHMEN[r][0], iv = RAHMEN[r][1], soll = RAHMEN[r][2];
        var a = await balken(sym, rahmen, von, bis);
        var z = { sym: sym, tag: tag, rahmen: rahmen, status: a.status, grenze: a.grenze, n: a.balken.length, seiten: a.seiten };
        var kopf = sym + ' ' + tag + ' ' + rahmen.padEnd(5) + ' HTTP ' + a.status + (a.grenze ? ' (Grenze ' + a.grenze + '/min)' : '') + '  Balken ' + a.balken.length;
        if (a.status === 401 || a.status === 403 || a.status === 422) { tarif++; z.rumpf = a.rumpf; sag(kopf + '  ABWEISUNG: ' + a.rumpf); E.abrufe.push(z); continue; }
        if (a.status !== 200) { netz++; z.rumpf = a.rumpf; sag(kopf + '  ' + a.rumpf); E.abrufe.push(z); continue; }
        if (!a.balken.length) {
          leer++;
          z.leer = true;
          sag(kopf + (sym === 'ARM' && tag < '2023-09' ? '  (erwartet: ARM erst seit 09/2023 notiert)' : '  LEER'));
          E.abrufe.push(z); continue;
        }
        mitBalken++;
        var erster = a.balken[0], letzter = a.balken[a.balken.length - 1];
        z.erster = erster.t; z.letzter = letzter.t;
        z.jahrStimmt = String(erster.t).slice(0, 10) === tag;
        if (!z.jahrStimmt) falschesJahr++;
        z.sekundenNull = a.balken.every(function (b) { return new Date(b.t).getUTCSeconds() === 0; });
        if (kal && kal.openUtc) {
          var oU = Date.parse(kal.openUtc), cU = Date.parse(kal.closeUtc);
          var regulaer = a.balken.filter(function (b) { var t = Date.parse(b.t); return t >= oU && t < cU; });
          z.vorboerse = a.balken.filter(function (b) { return Date.parse(b.t) < oU; }).length;
          z.nachboerse = a.balken.filter(function (b) { return Date.parse(b.t) >= cU; }).length;
          z.regulaer = regulaer.length;
          z.regulaerSoll = soll;
          z.ersterRegulaer = regulaer.length ? regulaer[0].t : null;
          z.oeffnungAlsStempel = regulaer.length ? Date.parse(regulaer[0].t) === oU : null;
        }
        sag(kopf + '  erster ' + erster.t + '  letzter ' + letzter.t +
          (z.jahrStimmt ? '' : '  FALSCHES JAHR') + (z.sekundenNull ? '' : '  STEMPEL MIT SEKUNDEN') +
          (z.regulaer != null ? '  regulaer ' + z.regulaer + '/' + soll + ' (vor ' + z.vorboerse + ', nach ' + z.nachboerse + ')' +
            (z.oeffnungAlsStempel === false ? '  erster regulaerer Balken NICHT auf der Eroeffnung: ' + z.ersterRegulaer : '') : ''));
        sag('      Beispiel: ' + JSON.stringify(erster));
        /* Gegen Yahoo, wo die Datei den Tag hat. */
        var y = yahooTag(sym, iv, tag);
        if (y && y.n) {
          var v = vergleiche(a.balken, y.karte);
          z.yahoo = { kerzenAmTag: y.n, gemeinsam: v.gemeinsam, medianAbwSchluss: v.medianAbw, maxAbwSchluss: v.maxAbw,
            ueber01Prozent: v.ueber01Prozent, umsatzFaktorMedian: v.faktorMedian, umsatzFaktorN: v.faktorN };
          sag('      Yahoo ' + iv + ': ' + y.n + ' Kerzen am Tag, gemeinsam ' + v.gemeinsam +
            (v.gemeinsam ? ', Schluss median ' + (v.medianAbw * 100).toFixed(4) + ' % / max ' + (v.maxAbw * 100).toFixed(3) + ' %, ueber 0,1 %: ' + v.ueber01Prozent +
              ', Umsatz-Faktor median ' + (v.faktorMedian == null ? '-' : v.faktorMedian.toFixed(3)) + ' (n ' + v.faktorN + ')'
              : ' - KEIN gemeinsamer Stempel (anderes Gitter?)'));
        } else {
          z.yahoo = null;
          sag('      Yahoo ' + iv + ': kein Vergleich (Datei hat den Tag nicht' + (y ? '' : ' / keine Datei') + ')');
        }
        E.abrufe.push(z);
        await pause(350);
      }
    }
  }

  /* BRK.B: welche Schreibweise nimmt Alpaca? Der Punkt ist getestet (oben); hier der
   * Bindestrich als Gegenprobe. */
  var brk = await balken('BRK-B', '1Min', '2026-08-27T13:00:00Z', '2026-08-27T15:00:00Z');
  var brkPunkt = E.abrufe.filter(function (z) { return z.sym === 'BRK.B' && z.tag === '2026-08-27' && z.rahmen === '1Min'; })[0];
  E.brkb = { punkt: brkPunkt ? { status: brkPunkt.status, n: brkPunkt.n } : null, strich: { status: brk.status, n: brk.balken.length, rumpf: brk.rumpf } };
  sag('');
  sag('BRK.B (Punkt): ' + JSON.stringify(E.brkb.punkt) + '   BRK-B (Strich): ' + JSON.stringify(E.brkb.strich));

  /* ---- Urteil. Die Kriterien stehen HIER, vor dem Lauf, nicht im Kopf danach. ---- */
  var k2026 = E.abrufe.filter(function (z) { return z.tag === '2026-08-27' && z.status === 200 && z.yahoo && (z.rahmen === '1Min' || z.rahmen === '5Min'); });
  var vergleichbar = k2026.filter(function (z) { return z.yahoo.gemeinsam >= (z.rahmen === '1Min' ? 300 : 60); });
  var schlussOk = vergleichbar.length > 0 && vergleichbar.every(function (z) { return z.yahoo.medianAbwSchluss <= 0.001 && z.yahoo.ueber01Prozent <= 0.02 * z.yahoo.gemeinsam; });
  var umsatzOk = vergleichbar.length > 0 && vergleichbar.every(function (z) { return z.yahoo.umsatzFaktorMedian != null && z.yahoo.umsatzFaktorMedian >= 0.8 && z.yahoo.umsatzFaktorMedian <= 1.25; });
  var oeffnungOk = E.abrufe.filter(function (z) { return z.rahmen === '1Min' && z.regulaer != null; }).every(function (z) { return z.oeffnungAlsStempel === true && z.sekundenNull; });
  var tiefeOk = ['2016-06-01', '2020-06-03', '2024-06-05'].every(function (t) {
    return E.abrufe.some(function (z) { return z.sym === 'AAPL' && z.tag === t && z.rahmen === '1Min' && z.status === 200 && z.n > 0 && z.jahrStimmt; });
  });
  var armOk = E.abrufe.filter(function (z) { return z.sym === 'ARM' && z.tag < '2023-09'; }).every(function (z) { return z.status !== 200 || z.n === 0; });
  var zahlOk = E.abrufe.filter(function (z) { return z.rahmen === '1Min' && z.regulaer != null && z.sym !== 'ARM'; }).every(function (z) { return z.regulaer >= 380 && z.regulaer <= 390; });
  E.urteil = {
    bestanden: tarif === 0 && falschesJahr === 0 && schlussOk && umsatzOk && oeffnungOk && tiefeOk && armOk && zahlOk,
    tarifabweisungen: tarif, netzfehler: netz, falschesJahr: falschesJahr, mitBalken: mitBalken, leer: leer,
    vergleichbareAbrufe2026: vergleichbar.length, schlussOk: schlussOk, umsatzOk: umsatzOk, oeffnungAlsStempel: oeffnungOk,
    tiefe2016bis2024: tiefeOk, armVorNotierungLeer: armOk, balkenzahl1Min: zahlOk,
    vorNachboerseKommtMit: E.abrufe.some(function (z) { return (z.vorboerse || 0) + (z.nachboerse || 0) > 0; }),
    gitter60m: (function () { var h = E.abrufe.filter(function (z) { return z.rahmen === '1Hour' && z.ersterRegulaer; })[0]; return h ? h.ersterRegulaer : null; })(),
  };
  sag('');
  sag('=== Urteil der Probe ===');
  sag(JSON.stringify(E.urteil, null, 1));
  sag(E.urteil.bestanden
    ? 'BESTANDEN. Der Nachholer (tools/alpaca-balken-holen.js) liest diese Freigabe.'
    : 'NICHT BESTANDEN. Kein Nachholer; die 1m-Tiefe bleibt bei den Yahoo-Kerzen (Entscheid 2, zweiter Halbsatz).');
  fs.writeFileSync(ERGEBNIS, S.verdecken(JSON.stringify(E, null, 1)));
  fs.writeFileSync(AUSGABE, zeilen.join('\n') + '\n');
  sag('Ergebnis: ' + ERGEBNIS);
}

/* ---- Selbsttest: kein Netz, boesartiger Server, der die Kopfzeilen zurueckspiegelt.
 *      Prueft, dass erfundene Zugangswerte in keiner Ausgabe landen. test-v6.js faehrt ihn. */
async function selbsttest() {
  var MARKE_ID = 'ZZTESTKENNUNGxyz1234', MARKE_GEHEIM = 'ZZTESTGEHEIMabcd5678';
  S.testZugangSetzen(MARKE_ID, MARKE_GEHEIM);
  var gesammelt = '';
  var echtesSchreiben = process.stdout.write.bind(process.stdout);
  process.stdout.write = function (chunk) { gesammelt += String(chunk); return echtesSchreiben(chunk); };
  var boese = async function (url, opt) {
    var kopf = JSON.stringify((opt && opt.headers) || {});
    return { status: 500, headers: { get: function () { return null; } },
             text: async function () { return 'Serverfehler bei ' + url + ' mit ' + kopf; } };
  };
  var r = await abruf(DATEN + '/stocks/bars?symbols=AAPL', boese);
  sag('Selbsttest-Rumpf: ' + r.text);
  sag('Selbsttest-Kopf: ' + JSON.stringify(S.kopfzeilen()));
  process.stdout.write = echtesSchreiben;
  var leck = gesammelt.indexOf(MARKE_ID) >= 0 || gesammelt.indexOf(MARKE_GEHEIM) >= 0;
  return { leck: leck, ausgabe: gesammelt };
}

module.exports = { abruf: abruf, vergleiche: vergleiche, selbsttest: selbsttest, ERGEBNIS: ERGEBNIS, SYMBOLE: SYMBOLE, TAGE: TAGE };

if (require.main === module) { main(); }
